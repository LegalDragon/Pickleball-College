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
    }
}