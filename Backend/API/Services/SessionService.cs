using Microsoft.EntityFrameworkCore;
using Pickleball.College.Database;
using Pickleball.College.Models.DTOs;
using Pickleball.College.Models.Entities;

namespace Pickleball.College.Services;

public class SessionService : ISessionService
{
    private readonly ApplicationDbContext _context;

    public SessionService(ApplicationDbContext context)
    {
        _context = context;
    }

    // Student requests a session (pending coach confirmation)
    public async Task<TrainingSession> RequestSessionAsync(CreateSessionRequest request, int studentId)
    {
        // Verify coach exists
        var coach = await _context.Users
            .Include(u => u.CoachProfile)
            .FirstOrDefaultAsync(u => u.Id == request.CoachId && u.Role == "Coach");

        if (coach == null)
        {
            throw new ArgumentException("Coach not found");
        }

        var session = new TrainingSession
        {
            CoachId = request.CoachId,
            StudentId = studentId,
            SessionType = request.SessionType,
            RequestedAt = request.RequestedAt,
            ScheduledAt = request.RequestedAt, // Initially same as requested
            DurationMinutes = request.DurationMinutes,
            Price = coach.CoachProfile?.HourlyRate ?? 0,  // Use coach's hourly rate
            Notes = request.Notes,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.TrainingSessions.Add(session);
        await _context.SaveChangesAsync();

        return await _context.TrainingSessions
            .Include(s => s.Coach)
            .Include(s => s.Student)
            .FirstOrDefaultAsync(s => s.Id == session.Id) ?? session;
    }

    // Coach confirms a session request
    public async Task<TrainingSession> ConfirmSessionAsync(ConfirmSessionRequest request, int coachId)
    {
        var session = await _context.TrainingSessions
            .Include(s => s.Coach)
            .Include(s => s.Student)
            .FirstOrDefaultAsync(s => s.Id == request.SessionId && s.CoachId == coachId);

        if (session == null)
        {
            throw new ArgumentException("Session not found");
        }

        if (session.Status != "Pending")
        {
            throw new InvalidOperationException("Session is not pending confirmation");
        }

        session.Price = request.Price;
        session.MeetingLink = request.MeetingLink;
        session.Location = request.Location;
        session.Status = "Confirmed";

        await _context.SaveChangesAsync();

        return session;
    }

    // Get pending session requests for a coach
    public async Task<List<TrainingSession>> GetPendingSessionsAsync(int coachId)
    {
        return await _context.TrainingSessions
            .Where(s => s.CoachId == coachId && s.Status == "Pending")
            .Include(s => s.Student)
            .OrderBy(s => s.RequestedAt)
            .ToListAsync();
    }

    public async Task<TrainingSession> ScheduleSessionAsync(SessionRequest request, int studentId)
    {
        var session = new TrainingSession
        {
            CoachId = request.CoachId,
            StudentId = studentId,
            MaterialId = request.MaterialId,
            SessionType = request.SessionType,
            ScheduledAt = request.ScheduledAt,
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            MeetingLink = request.MeetingLink,
            Location = request.Location,
            Status = "Confirmed",
            CreatedAt = DateTime.UtcNow
        };

        _context.TrainingSessions.Add(session);
        await _context.SaveChangesAsync();

        return await _context.TrainingSessions
            .Include(s => s.Coach)
            .Include(s => s.Student)
            .Include(s => s.Material)
            .FirstOrDefaultAsync(s => s.Id == session.Id) ?? session;
    }

    public async Task<List<TrainingSession>> GetCoachSessionsAsync(int coachId)
    {
        return await _context.TrainingSessions
            .Where(s => s.CoachId == coachId)
            .Include(s => s.Student)
            .Include(s => s.Material)
            .OrderBy(s => s.ScheduledAt)
            .ToListAsync();
    }

    public async Task<List<TrainingSession>> GetStudentSessionsAsync(int studentId)
    {
        return await _context.TrainingSessions
            .Where(s => s.StudentId == studentId)
            .Include(s => s.Coach)
            .Include(s => s.Material)
            .OrderBy(s => s.ScheduledAt)
            .ToListAsync();
    }

    public async Task<bool> CancelSessionAsync(int sessionId, int userId)
    {
        var session = await _context.TrainingSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && (s.CoachId == userId || s.StudentId == userId));

        if (session == null)
        {
            return false;
        }

        session.Status = "Cancelled";
        await _context.SaveChangesAsync();
        return true;
    }
}
