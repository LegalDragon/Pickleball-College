using Pickleball.College.Models.DTOs;
using Pickleball.College.Models.Entities;

namespace Pickleball.College.Services;

public interface IMaterialService
{
    Task<MaterialDto> CreateMaterialAsync(int coachId, CreateMaterialRequest request, string? videoUrl, string? thumbnailUrl);
    Task<MaterialDto> UpdateMaterialAsync(int materialId, int coachId, UpdateMaterialRequest request, string? videoUrl, string? thumbnailUrl);
    Task<PurchaseResult> PurchaseMaterialAsync(int studentId, int materialId);
    Task<List<MaterialDto>> GetPublishedMaterialsAsync();
    Task<List<MaterialDto>> GetCoachMaterialsAsync(int coachId);
    Task<MaterialDto> GetMaterialAsync(int materialId);
    Task<MaterialDto> TogglePublishAsync(int materialId, int coachId);
}

public interface IFileStorageService
{
    Task<string> UploadFileAsync(IFormFile file, string containerName);
    Task DeleteFileAsync(string fileUrl);
}

public interface IStripeService
{
    Task<Stripe.PaymentIntent> CreatePaymentIntentAsync(decimal amount, string description);
    Task<string> CreateCoachAccountAsync(string email);
    Task<bool> ProcessPayoutAsync(string coachStripeAccountId, decimal amount);
}

public interface IAuthService
{
    Task<User?> AuthenticateAsync(string email, string password);
    Task<User?> FastAuthenticateAsync(string token);
    Task<User> RegisterAsync(RegisterRequest request);
    string GenerateJwtToken(User user);
}

public interface ISessionService
{
    Task<TrainingSession> ScheduleSessionAsync(SessionRequest request, int studentId);
    Task<List<TrainingSession>> GetCoachSessionsAsync(int coachId);
    Task<List<TrainingSession>> GetStudentSessionsAsync(int studentId);
    Task<bool> CancelSessionAsync(int sessionId, int userId);
}
