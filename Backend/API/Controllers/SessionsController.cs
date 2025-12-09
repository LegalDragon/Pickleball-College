using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Pickleball.College.Services;
using Pickleball.College.Models.DTOs;

namespace Pickleball.College.API.Controllers;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class SessionsController : ControllerBase
{
    private readonly ISessionService _sessionService;

    public SessionsController(ISessionService sessionService)
    {
        _sessionService = sessionService;
    }

    [HttpPost]
    public async Task<ActionResult> ScheduleSession(SessionRequest request)
    {
        var studentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(studentId) || !Guid.TryParse(studentId, out var studentGuid))
        {
            return Unauthorized();
        }

        try
        {
            var session = await _sessionService.ScheduleSessionAsync(request, studentGuid);
            return Ok(session);
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to schedule session: {ex.Message}");
        }
    }

    [HttpGet("coach/{coachId}")]
    [Authorize(Roles = "Coach")]
    public async Task<ActionResult> GetCoachSessions(Guid coachId)
    {
        //var coachId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        //if (string.IsNullOrEmpty(coachId) || !Guid.TryParse(coachId, out var coachGuid))
        //{
        //    return Unauthorized();
        //}

        //var sessions = await _sessionService.GetCoachSessionsAsync(coachGuid);
        var sessions = await _sessionService.GetCoachSessionsAsync(coachId);
        return Ok(sessions);
    }

    [HttpGet("student")]
    public async Task<ActionResult> GetStudentSessions()
    {
        var studentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(studentId) || !Guid.TryParse(studentId, out var studentGuid))
        {
            return Unauthorized();
        }

        var sessions = await _sessionService.GetStudentSessionsAsync(studentGuid);
        return Ok(sessions);
    }

    [HttpDelete("{sessionId}")]
    public async Task<ActionResult> CancelSession(Guid sessionId)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId) || !Guid.TryParse(userId, out var userGuid))
        {
            return Unauthorized();
        }

        var result = await _sessionService.CancelSessionAsync(sessionId, userGuid);
        if (!result)
        {
            return NotFound("Session not found or you don't have permission to cancel it");
        }

        return Ok(new { Message = "Session cancelled successfully" });
    }
}
