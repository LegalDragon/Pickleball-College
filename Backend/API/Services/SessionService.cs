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

    public async Task<TrainingSession> ScheduleSessionAsync(SessionRequest request, Guid studentId)
    {
        var session = new TrainingSession
        {
            Id = Guid.NewGuid(),
            CoachId = request.CoachId,
            StudentId = studentId,
            MaterialId = request.MaterialId,
            SessionType = request.SessionType,
            ScheduledAt = request.ScheduledAt,
            DurationMinutes = request.DurationMinutes,
            Price = request.Price,
            MeetingLink = request.MeetingLink,
            Location = request.Location,
            Status = "Scheduled",
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

    public async Task<List<TrainingSession>> GetCoachSessionsAsync(Guid coachId)
    {
        return await _context.TrainingSessions
            .Where(s => s.CoachId == coachId)
            .Include(s => s.Student)
            .Include(s => s.Material)
            .OrderBy(s => s.ScheduledAt)
            .ToListAsync();
    }

    public async Task<List<TrainingSession>> GetStudentSessionsAsync(Guid studentId)
    {
        return await _context.TrainingSessions
            .Where(s => s.StudentId == studentId)
            .Include(s => s.Coach)
            .Include(s => s.Material)
            .OrderBy(s => s.ScheduledAt)
            .ToListAsync();
    }

    public async Task<bool> CancelSessionAsync(Guid sessionId, Guid userId)
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
