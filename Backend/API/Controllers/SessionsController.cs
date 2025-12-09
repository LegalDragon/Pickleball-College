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
        var studentIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(studentIdStr) || !int.TryParse(studentIdStr, out var studentId))
        {
            return Unauthorized();
        }

        try
        {
            var session = await _sessionService.ScheduleSessionAsync(request, studentId);
            return Ok(session);
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to schedule session: {ex.Message}");
        }
    }

    [HttpGet("coach/{coachId}")]
    [Authorize(Roles = "Coach")]
    public async Task<ActionResult> GetCoachSessions(int coachId)
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
        var studentIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(studentIdStr) || !int.TryParse(studentIdStr, out var studentId))
        {
            return Unauthorized();
        }

        var sessions = await _sessionService.GetStudentSessionsAsync(studentId);
        return Ok(sessions);
    }

    [HttpDelete("{sessionId}")]
    public async Task<ActionResult> CancelSession(int sessionId)
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var result = await _sessionService.CancelSessionAsync(sessionId, userId);
        if (!result)
        {
            return NotFound("Session not found or you don't have permission to cancel it");
        }

        return Ok(new { Message = "Session cancelled successfully" });
    }
}
