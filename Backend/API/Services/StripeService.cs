using Microsoft.EntityFrameworkCore;
using Pickleball.College.Models.Entities;

namespace Pickleball.College.Database;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<CoachProfile> CoachProfiles { get; set; }
    public DbSet<TrainingMaterial> TrainingMaterials { get; set; }
    public DbSet<MaterialPurchase> MaterialPurchases { get; set; }
    public DbSet<TrainingSession> TrainingSessions { get; set; }

    // Courses
    public DbSet<Course> Courses { get; set; }
    public DbSet<CourseMaterial> CourseMaterials { get; set; }
    public DbSet<CoursePurchase> CoursePurchases { get; set; }

    // Theme and Asset Management
    public DbSet<ThemeSettings> ThemeSettings { get; set; }
    public DbSet<ThemePreset> ThemePresets { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    public DbSet<Asset> Assets { get; set; }

    // Content Types for Materials
    public DbSet<ContentType> ContentTypes { get; set; }

    // Ratings
    public DbSet<Rating> Ratings { get; set; }

    // Tags
    public DbSet<TagDefinition> TagDefinitions { get; set; }
    public DbSet<ObjectTag> ObjectTags { get; set; }

    // Video Review Requests
    public DbSet<VideoReviewRequest> VideoReviewRequests { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();
        });

        modelBuilder.Entity<TrainingMaterial>(entity =>
        {
            entity.HasOne(tm => tm.Coach)
                  .WithMany(u => u.TrainingMaterials)
                  .HasForeignKey(tm => tm.CoachId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(tm => tm.ContentType).HasConversion<string>();
        });

        modelBuilder.Entity<TrainingSession>(entity =>
        {
            entity.Property(ts => ts.SessionType).HasConversion<string>();
            entity.Property(ts => ts.Status).HasConversion<string>();

            entity.HasOne(ts => ts.Coach)
                  .WithMany(u => u.CoachingSessions)
                  .HasForeignKey(ts => ts.CoachId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ts => ts.Student)
                  .WithMany(u => u.StudentSessions)
                  .HasForeignKey(ts => ts.StudentId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MaterialPurchase>(entity =>
        {
            entity.HasOne(mp => mp.Student)
                  .WithMany(u => u.MaterialPurchases)
                  .HasForeignKey(mp => mp.StudentId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(mp => mp.Material)
                  .WithMany(tm => tm.Purchases)
                  .HasForeignKey(mp => mp.MaterialId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CoachProfile>(entity =>
        {
            entity.HasOne(cp => cp.User)
                  .WithOne(u => u.CoachProfile)
                  .HasForeignKey<CoachProfile>(cp => cp.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Course configuration
        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasOne(c => c.Coach)
                  .WithMany()
                  .HasForeignKey(c => c.CoachId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(c => c.Title).IsRequired().HasMaxLength(200);
            entity.Property(c => c.Description).HasMaxLength(2000);
        });

        modelBuilder.Entity<CourseMaterial>(entity =>
        {
            entity.HasOne(cm => cm.Course)
                  .WithMany(c => c.CourseMaterials)
                  .HasForeignKey(cm => cm.CourseId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cm => cm.Material)
                  .WithMany(m => m.CourseMaterials)
                  .HasForeignKey(cm => cm.MaterialId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(cm => new { cm.CourseId, cm.MaterialId }).IsUnique();
        });

        modelBuilder.Entity<CoursePurchase>(entity =>
        {
            entity.HasOne(cp => cp.Course)
                  .WithMany(c => c.Purchases)
                  .HasForeignKey(cp => cp.CourseId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(cp => cp.Student)
                  .WithMany()
                  .HasForeignKey(cp => cp.StudentId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(cp => new { cp.CourseId, cp.StudentId }).IsUnique();
        });

        // Theme and Asset Management configuration
        modelBuilder.Entity<ThemeSettings>(entity =>
        {
            entity.HasKey(t => t.ThemeId);
            entity.Property(t => t.OrganizationName).HasMaxLength(200);
        });

        modelBuilder.Entity<ThemePreset>(entity =>
        {
            entity.HasKey(p => p.PresetId);
            entity.Property(p => p.PresetName).HasMaxLength(100);
        });

        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.HasKey(a => a.LogId);
            entity.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Content Types configuration and seed data
        modelBuilder.Entity<ContentType>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.Code).IsUnique();
            entity.Property(c => c.Name).IsRequired().HasMaxLength(50);
            entity.Property(c => c.Code).IsRequired().HasMaxLength(50);

            entity.HasData(
                new ContentType
                {
                    Id = 1,
                    Name = "Video",
                    Code = "Video",
                    Icon = "Video",
                    Prompt = "Upload a video file or paste a YouTube/TikTok link",
                    AllowedExtensions = ".mp4,.mov,.avi,.wmv,.webm,.mkv",
                    MaxFileSizeMB = 500,
                    SortOrder = 1,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new ContentType
                {
                    Id = 2,
                    Name = "Image",
                    Code = "Image",
                    Icon = "Image",
                    Prompt = "Upload an image file (PNG, JPG, WebP)",
                    AllowedExtensions = ".jpg,.jpeg,.png,.gif,.webp,.svg",
                    MaxFileSizeMB = 10,
                    SortOrder = 2,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new ContentType
                {
                    Id = 3,
                    Name = "Document",
                    Code = "Document",
                    Icon = "FileText",
                    Prompt = "Upload a document file (PDF, Word, PowerPoint)",
                    AllowedExtensions = ".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx",
                    MaxFileSizeMB = 50,
                    SortOrder = 3,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new ContentType
                {
                    Id = 4,
                    Name = "Audio",
                    Code = "Audio",
                    Icon = "Music",
                    Prompt = "Upload an audio file (MP3, WAV, M4A)",
                    AllowedExtensions = ".mp3,.wav,.m4a,.ogg,.flac,.aac",
                    MaxFileSizeMB = 100,
                    SortOrder = 4,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                },
                new ContentType
                {
                    Id = 5,
                    Name = "External Link",
                    Code = "Link",
                    Icon = "Link",
                    Prompt = "Paste an external URL (YouTube, TikTok, or any video link)",
                    AllowedExtensions = "",
                    MaxFileSizeMB = 0,
                    SortOrder = 5,
                    IsActive = true,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                }
            );
        });

        // Rating configuration
        modelBuilder.Entity<Rating>(entity =>
        {
            entity.HasOne(r => r.User)
                  .WithMany()
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(r => r.RatableType).IsRequired().HasMaxLength(50);
            entity.Property(r => r.Stars).IsRequired();
            entity.Property(r => r.Review).HasMaxLength(1000);

            // Composite index for unique rating per user per ratable item
            entity.HasIndex(r => new { r.UserId, r.RatableType, r.RatableId }).IsUnique();
            // Index for querying ratings by ratable item
            entity.HasIndex(r => new { r.RatableType, r.RatableId });
        });

        // Tag configuration
        modelBuilder.Entity<TagDefinition>(entity =>
        {
            entity.Property(t => t.Name).IsRequired().HasMaxLength(50);
            entity.HasIndex(t => t.Name).IsUnique();
        });

        modelBuilder.Entity<ObjectTag>(entity =>
        {
            entity.HasOne(ot => ot.Tag)
                  .WithMany(t => t.ObjectTags)
                  .HasForeignKey(ot => ot.TagId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ot => ot.CreatedByUser)
                  .WithMany()
                  .HasForeignKey(ot => ot.CreatedByUserId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.Property(ot => ot.ObjectType).IsRequired().HasMaxLength(50);

            // Unique constraint: one tag per object
            entity.HasIndex(ot => new { ot.TagId, ot.ObjectType, ot.ObjectId }).IsUnique();
            // Index for querying tags by object
            entity.HasIndex(ot => new { ot.ObjectType, ot.ObjectId });
        });

        // VideoReviewRequest configuration
        modelBuilder.Entity<VideoReviewRequest>(entity =>
        {
            entity.HasOne(v => v.Student)
                  .WithMany()
                  .HasForeignKey(v => v.StudentId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(v => v.TargetCoach)
                  .WithMany()
                  .HasForeignKey(v => v.CoachId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(v => v.AcceptedByCoach)
                  .WithMany()
                  .HasForeignKey(v => v.AcceptedByCoachId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.Property(v => v.Title).IsRequired().HasMaxLength(200);
            entity.Property(v => v.VideoUrl).IsRequired().HasMaxLength(500);
            entity.Property(v => v.Status).IsRequired().HasMaxLength(50);

            // Index for finding open requests
            entity.HasIndex(v => v.Status);
            entity.HasIndex(v => v.StudentId);
            entity.HasIndex(v => v.CoachId);
        });
    }
}