---
tags: ["Linux", "Fedora", "Flatpak"]
blog: true
description: 将 Fedora 作为主力开发系统, 解决中文输入法问题, 使用 Flatpak 安装软件
---

# Fedora Workstation 开发配置

## 系统配置

### 更改主机名

将主机名更改为 `fedora`：

```bash
sudo hostnamectl set-hostname fedora
```

### 修改镜像源

使用清华大学 Fedora 镜像源：

```bash
sudo sed -e 's|^metalink=|#metalink=|g' \
    -e 's|^#baseurl=http://download.example/pub/fedora/linux|baseurl=https://mirrors.tuna.tsinghua.edu.cn/fedora|g' \
    -i.bak \
    /etc/yum.repos.d/fedora.repo \
    /etc/yum.repos.d/fedora-updates.repo
```

修改镜像后，建议升级并更新系统，之后重启电脑：

```bash
sudo dnf update
```

### 配置中文输入法

安装 `fcitx5` 输入法：

```bash
sudo dnf install fcitx5 fcitx5-chinese-addons fcitx5-configtool fcitx5-autostart
```

修改文件 **/etc/environment**，避免部分软件输入时输入法显示错位：

```bash
sudo msedit /etc/environment
```

添加以下内容，登出用户重新加载生效：

```
GTK_IM_MODULE=fcitx
QT_IM_MODULE=fcitx
XMODIFIERS=@im=fcitx
INPUT_METHOD=fcitx
SDL_IM_MODULE=fcitx
GLFW_IM_MODULE=ibus
```

安装 Gnome Shell 输入法插件 [Kimpanel](https://extensions.gnome.org/extension/261/kimpanel/)。

### 安装常用插件

1. **任务栏插件**（让 Telegram 等应用最小化后可以看到图标）
   [Appindicator Support](https://extensions.gnome.org/extension/615/appindicator-support/)
2. **咖啡因插件**（避免电脑进入睡眠）
   [Caffeine](https://extensions.gnome.org/extension/517/caffeine/)
3. **边缘操控扩展**（鼠标移动到屏幕底端自动显示 dock）
   [Hot Edge](https://extensions.gnome.org/extension/4222/hot-edge/)
4. 你还可以在 Fedora 默认程序列表中找到一个叫做 “拓展” (extensions) 的软件，运行后可以管理和设置已安装的扩展。

## dnf 包管理安装工具

### 安装常用工具

```bash
sudo dnf install -y curl wget msedit
```

### 安装开发环境

1. **C++**
   安装基础编译工具和调试工具：

   ```bash
   sudo dnf install -y gcc gcc-c++ gdb make cmake ninja-build
   ```

   可选安装 Clang 工具链：

   ```bash
   sudo dnf install -y clang clang-tools-extra
   ```

2. **Go语言**
   安装 Go 编译器：

   ```bash
   sudo dnf install -y golang
   ```

3. **Node.js**
   安装 Node.js 和 npm：

   ```bash
   sudo dnf install -y nodejs npm
   ```

4. **Python**
   安装 Python：

   ```bash
   sudo dnf install -y uv
   ```

### 安装配置 Git

安装 Git：

```bash
sudo dnf install -y git
```

配置 Git：

```bash
# 设置默认分支为 main
git config --global init.defaultBranch main

# 配置用户名
git config --global user.name "touken"

# 配置用户邮箱
git config --global user.email "touken928@foxmail.com"

# 关闭路径转换，解决中文文件名显示问题
git config --global core.quotepath false
```

### 安装配置 Docker

1. **Docker CE** 安装 Docker：

   ```bash
   sudo dnf config-manager addrepo --from-repofile https://download.docker.com/linux/fedora/docker-ce.repo
   
   # 可选的使用国内源安装 Docker
   sudo sed -i 's/download.docker.com/mirrors.aliyun.com\/docker-ce/g' /etc/yum.repos.d/docker-ce.repo
   
   sudo dnf install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
   sudo systemctl enable --now docker
   ```

   开机自启动 Docker：

   ```bash
   sudo systemctl enable docker.service
   ```

   启动 Docker：

   ```bash
   sudo systemctl start docker.service
   ```

2. **解决 Docker 权限问题**：

   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. **配置代理**（如果需要）：

   编辑 Docker 配置文件：

   ```bash
   sudo msedit /etc/docker/daemon.json
   ```

   添加以下内容：

   ```json
   {
      "proxies": {
          "http-proxy": "http://127.0.0.1:10808",
          "https-proxy": "http://127.0.0.1:10808"
      }
   }
   ```

   重启 Docker 服务：

   ```bash
   sudo systemctl daemon-reload
   sudo systemctl restart docker
   ```

4. **登录 Docker** 并拉取镜像：

   ```bash
   docker login
   docker pull hello-world
   ```

### 安装 Visual Studio Code

1. 创建 VS Code 仓库文件：

   ```bash
   sudo msedit /etc/yum.repos.d/vscode.repo
   ```

2. 粘贴以下内容并保存：

   ```ini
   [code]
   name=Visual Studio Code
   baseurl=https://packages.microsoft.com/yumrepos/vscode
   enabled=1
   gpgcheck=1
   gpgkey=https://packages.microsoft.com/keys/microsoft.asc
   ```

3. 安装 VS Code：

   ```bash
   sudo dnf install code
   ```

4. 下载并安装[JetBrains Mono](https://www.jetbrains.com/lp/mono/)字体

   ```bash
   # 创建字体目标目录 /usr/share/fonts/JetBrainsMono
   sudo mkdir -p /usr/share/fonts/JetBrainsMono
   
   # 解压 JetBrainsMono.zip 中的所有 .ttf 字体文件到临时目录 /tmp/JetBrainsMono
   unzip -q JetBrainsMono-2.304.zip "fonts/ttf/*.ttf" -d /tmp/JetBrainsMono
   
   # 将临时目录中的所有 .ttf 文件移动到 /usr/share/fonts/JetBrainsMono 目录
   sudo find /tmp/JetBrainsMono -type f -name "*.ttf" -exec mv {} /usr/share/fonts/JetBrainsMono/ \;
   
   # 更新字体缓存，确保系统识别新安装的字体
   sudo fc-cache -fv
   
   # 检查字体是否成功安装并列出包含 JetBrainsMono 字体的路径
   fc-list | grep JetBrainsMono
   ```

5. 设置中搜索“Font Family”，首部追加`'JetBrains Mono'`，英文逗号分割：

   ```
   'JetBrains Mono', 'Droid Sans Mono', monospace
   ```

## Flatpak 沙盒化软件

1. 添加 Flathub 仓库：

   ```bash
   flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
   ```

   可选：修改为上海交通大学镜像：

   ```bash
   flatpak remote-modify flathub --url=https://mirror.sjtu.edu.cn/flathub
   ```

2. 安装常用应用：

   ```bash
   flatpak install flathub io.typora.Typora
   flatpak install flathub org.remmina.Remmina
   flatpak install flathub com.qq.QQ
   flatpak install flathub com.tencent.WeChat
   flatpak install flathub com.tencent.wemeet
   ```

## Fedora 大版本更新

当 Fedora 发布新版本进入 Beta 之后，可以通过以下命令进行大版本更新：

```bash
sudo dnf upgrade --refresh
sudo dnf install dnf-plugin-system-upgrade
sudo dnf system-upgrade download --releasever=44
sudo dnf system-upgrade reboot
```

## 参考资料

- [Fedora 个人配置](https://demodeom.github.io/2025/10/02/Linux/Fedora43个人配置/)
- [Fedora Linux 安装配置记录](https://blog.dejavu.moe/posts/install-and-use-fedora-workstation/)
- [Fedora 42 安装记录](https://plumz.me/archives/14050/)
- [Fedora 安装 Docker](https://vuepress.mirror.docker-practice.com/install/fedora/#%E4%BD%BF%E7%94%A8-dnf-%E5%AE%89%E8%A3%85)
