using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Pickleball.College.Services;
using Pickleball.College.Models.DTOs;

namespace Pickleball.College.API.Controllers;

[ApiController]
[Route("api/[controller]")]
//[Authorize]
public class MaterialsController : ControllerBase
{
    private readonly IMaterialService _materialService;
    private readonly IFileStorageService _fileStorageService;

    public MaterialsController(IMaterialService materialService, IFileStorageService fileStorageService)
    {
        _materialService = materialService;
        _fileStorageService = fileStorageService;
    }

    [HttpPost]
    public async Task<ActionResult<MaterialDto>> CreateMaterial([FromForm] CreateMaterialRequest request)
    {
        var coachId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(coachId) || !Guid.TryParse(coachId, out var coachGuid))
        {
            return Unauthorized();
        }

        try
        {
            string? videoUrl = null;
            string? thumbnailUrl = null;

            if (request.VideoFile != null)
            {
                videoUrl = await _fileStorageService.UploadFileAsync(request.VideoFile, "videos");
            }

            if (request.ThumbnailFile != null)
            {
                thumbnailUrl = await _fileStorageService.UploadFileAsync(request.ThumbnailFile, "thumbnails");
            }

            var material = await _materialService.CreateMaterialAsync(coachGuid, request, videoUrl, thumbnailUrl);
            return Ok(material);
        }
        catch (Exception ex)
        {
            return BadRequest($"Failed to create material: {ex.Message}");
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<MaterialDto>>> GetPublishedMaterials()
    {
        var materials = await _materialService.GetPublishedMaterialsAsync();
        return Ok(materials);
    }

    [HttpGet("coach/{coachId}")]
    [Authorize(Roles = "Coach")]
    public async Task<ActionResult<List<MaterialDto>>> GetCoachMaterials(Guid coachId)
    {
        var materials = await _materialService.GetCoachMaterialsAsync(coachId);
        return Ok(materials);
    }

    [HttpGet("{materialId}")]
    [AllowAnonymous]
    public async Task<ActionResult<MaterialDto>> GetMaterial(Guid materialId)
    {
        var material = await _materialService.GetMaterialAsync(materialId);
        return Ok(material);
    }

    [HttpPost("{materialId}/purchase")]
    public async Task<ActionResult<PurchaseResult>> PurchaseMaterial(Guid materialId)
    {
        var studentId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(studentId) || !Guid.TryParse(studentId, out var studentGuid))
        {
            return Unauthorized();
        }

        try
        {
            var result = await _materialService.PurchaseMaterialAsync(studentGuid, materialId);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            return BadRequest($"Purchase failed: {ex.Message}");
        }
    }
}
