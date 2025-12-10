using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Pickleball.College.Models.DTOs;
using Pickleball.College.Services;
using System.Security.Claims;

namespace Pickleball.College.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VideoReviewsController : ControllerBase
{
    private readonly IVideoReviewService _videoReviewService;

    public VideoReviewsController(IVideoReviewService videoReviewService)
    {
        _videoReviewService = videoReviewService;
    }

    /// <summary>
    /// Create a new video review request (student)
    /// </summary>
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<VideoReviewRequestDto>> CreateRequest([FromBody] CreateVideoReviewRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var result = await _videoReviewService.CreateRequestAsync(userId.Value, request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get current user's video review requests (student)
    /// </summary>
    [HttpGet("my-requests")]
    [Authorize]
    public async Task<ActionResult<List<VideoReviewRequestDto>>> GetMyRequests()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var requests = await _videoReviewService.GetStudentRequestsAsync(userId.Value);
        return Ok(requests);
    }

    /// <summary>
    /// Cancel a video review request (student)
    /// </summary>
    [HttpDelete("{requestId}")]
    [Authorize]
    public async Task<ActionResult> CancelRequest(int requestId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var result = await _videoReviewService.CancelRequestAsync(userId.Value, requestId);
            if (!result) return NotFound();
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get open video review requests (coach)
    /// </summary>
    [HttpGet("open")]
    [Authorize]
    public async Task<ActionResult<List<VideoReviewRequestDto>>> GetOpenRequests()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        // Include requests targeted at this coach
        var requests = await _videoReviewService.GetOpenRequestsAsync(userId.Value);
        return Ok(requests);
    }

    /// <summary>
    /// Get coach's assigned video review requests (coach)
    /// </summary>
    [HttpGet("coach")]
    [Authorize]
    public async Task<ActionResult<List<VideoReviewRequestDto>>> GetCoachRequests()
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var requests = await _videoReviewService.GetCoachRequestsAsync(userId.Value);
        return Ok(requests);
    }

    /// <summary>
    /// Accept a video review request (coach)
    /// </summary>
    [HttpPost("{requestId}/accept")]
    [Authorize]
    public async Task<ActionResult<VideoReviewRequestDto>> AcceptRequest(int requestId)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        try
        {
            var result = await _videoReviewService.AcceptRequestAsync(userId.Value, requestId);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Complete a video review (coach)
    /// </summary>
    [HttpPost("{requestId}/complete")]
    [Authorize]
    public async Task<ActionResult<VideoReviewRequestDto>> CompleteReview(
        int requestId,
        [FromBody] CompleteVideoReviewRequest request)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        request.RequestId = requestId;

        try
        {
            var result = await _videoReviewService.CompleteReviewAsync(userId.Value, request);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific video review request
    /// </summary>
    [HttpGet("{requestId}")]
    [Authorize]
    public async Task<ActionResult<VideoReviewRequestDto>> GetRequest(int requestId)
    {
        var result = await _videoReviewService.GetRequestAsync(requestId);
        if (result == null) return NotFound();

        // Verify user has access (student or coach involved)
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        if (result.StudentId != userId && result.CoachId != userId && result.AcceptedByCoachId != userId)
        {
            return Forbid();
        }

        return Ok(result);
    }

    private int? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                       ?? User.FindFirst("sub")?.Value
                       ?? User.FindFirst("userId")?.Value;

        if (int.TryParse(userIdClaim, out var userId))
            return userId;

        return null;
    }
}
