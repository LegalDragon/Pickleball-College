namespace Pickleball.College.Models.DTOs;

public class CreateMaterialRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ContentType { get; set; } = "Text";
    public string ExternalLink { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public IFormFile? VideoFile { get; set; }
    public IFormFile? ThumbnailFile { get; set; }
}
