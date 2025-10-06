using Xunit;

namespace StaffManagementSystem.Tests;

public class BasicTests
{
    [Fact]
    public void BasicTest_ShouldPass()
    {
        // Arrange
        var expected = true;
        
        // Act
        var actual = true;
        
        // Assert
        Assert.Equal(expected, actual);
    }
    
    [Theory]
    [InlineData(1, 2, 3)]
    [InlineData(2, 3, 5)]
    [InlineData(-1, 1, 0)]
    public void Add_ShouldReturnCorrectSum(int a, int b, int expected)
    {
        // Act
        var result = a + b;
        
        // Assert
        Assert.Equal(expected, result);
    }
}