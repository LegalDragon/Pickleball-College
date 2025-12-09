using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pickleball.College.Models.DTOs;
using Pickleball.College.Services;
using Stripe.Climate;

namespace Pickleball.College.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
     
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult> Register(RegisterRequest request)
    {
        try
        {
            var user = await _authService.RegisterAsync(request);
            var token = _authService.GenerateJwtToken(user);
            
            return Ok(new {
                Token = token,
                User = new { user.Id, user.Email, user.FirstName, user.LastName, user.Role, user.ProfileImageUrl }
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult> Login([FromBody] LoginDto loginDto)
    {
        var user = await _authService.AuthenticateAsync(loginDto.Email, loginDto.Password);

        if (user == null)
        {
            return Unauthorized("Invalid credentials");
        }
        var token = _authService.GenerateJwtToken(user);

        return Ok(new
        {
            Token = token, // JWT token only
            User = new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.Role,
                user.ProfileImageUrl
            }
        });
    }

    [HttpPost("fastlogin")]
    public async Task<ActionResult> FastLogin([FromBody]string token)
    {

        var user = await _authService.FastAuthenticateAsync(token);
        if (user == null)
        {
            return Unauthorized("Invalid token");
        }
         
         
        return Ok(new
        {
            Token = token,
            User = new { user.Id, user.Email, user.FirstName, user.LastName, user.Role, user.ProfileImageUrl }
        });
    }
}
