# 使用官方 .NET 8 SDK 镜像进行构建
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build-env
WORKDIR /app

# 复制 csproj 文件并还原依赖
COPY StaffManagementSystem/*.csproj ./StaffManagementSystem/
RUN dotnet restore StaffManagementSystem/StaffManagementSystem.csproj

# 复制所有源代码
COPY . ./

# 构建应用
WORKDIR /app/StaffManagementSystem
RUN dotnet publish -c Release -o out

# 构建运行时镜像
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# 安装必要的工具
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 从构建环境复制已发布的应用
COPY --from=build-env /app/StaffManagementSystem/out .

# 创建非 root 用户
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

# 暴露端口
EXPOSE 5000

# 设置环境变量
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# 启动应用
ENTRYPOINT ["dotnet", "StaffManagementSystem.dll"]