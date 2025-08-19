using System.Security.Cryptography;
using System.Text;

namespace StaffManagementSystem.Services
{
    public class PasswordHasher
    {
        /// <summary>
        /// 生成密码哈希和盐
        /// </summary>
        public static void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using var hmac = new HMACSHA512();
            passwordSalt = hmac.Key; // 随机生成的密钥作为盐
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }

        /// <summary>
        /// 验证密码是否正确
        /// </summary>
        public static bool VerifyPassword(string password, byte[] storedHash, byte[] storedSalt)
        {
            using var hmac = new HMACSHA512(storedSalt); // 使用原盐
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));

            // 用逐字节比较代替 SequenceEqual，以防 timing attack
            for (int i = 0; i < computedHash.Length; i++)
            {
                if (computedHash[i] != storedHash[i]) return false;
            }
            return true;
        }
    }
}
