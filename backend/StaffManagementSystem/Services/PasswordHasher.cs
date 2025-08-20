using System.Security.Cryptography;
using System.Text;

namespace StaffManagementSystem.Services
{
    public class PasswordHasher
    {
        /// <summary>
        /// Generate password hash and salt
        /// </summary>
        public static void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using var hmac = new HMACSHA512();
            passwordSalt = hmac.Key; // Randomly generated key as salt
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }

        /// <summary>
        /// Verify if password is correct
        /// </summary>
        public static bool VerifyPassword(string password, byte[] storedHash, byte[] storedSalt)
        {
            using var hmac = new HMACSHA512(storedSalt); // Use original salt
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));

            // Use byte-by-byte comparison instead of SequenceEqual to prevent timing attacks
            for (int i = 0; i < computedHash.Length; i++)
            {
                if (computedHash[i] != storedHash[i]) return false;
            }
            return true;
        }
    }
}
