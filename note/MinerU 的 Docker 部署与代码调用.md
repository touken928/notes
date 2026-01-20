---
tags: ["MinerU", "Docker", "VLM", "OCR"]
blog: true
description: 容器化部署 MinerU 的方案, 使用官方 API 调用
---

# MinerU 的 Docker 部署与代码调用

> 文章实验于2026年1月6日，使用RTX4060laptop显卡的Windows电脑，通过WSL运行Fedora-43，在科学上网环境下执行。

## 环境准备

### 1. Linux 环境

满足 MinerU 要求：

- 可能仅在 Ampere（对应30系）、Ada Lovelace（对应40系）、Hopper架构上工作（H100 H200等）。
- 设备应包含 Volta 及以后架构的显卡，且显存大于等于 8GB。
- 物理机的显卡驱动需支持 CUDA 12.8 或更高版本，可以通过 `nvidia-smi` 命令检查驱动版本。
- Docker 容器中能够访问物理机的显卡设备。

### 2. Docker

参考官方文档安装 Docker：[Install | Docker Docs](https://docs.docker.com/engine/install/)

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 3. NVIDIA Container Toolkit

参考 [NVIDIA 容器工具包安装指南](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)

#### 配置生产仓库

```bash
curl -s -L https://nvidia.github.io/libnvidia-container/stable/rpm/nvidia-container-toolkit.repo | \
  sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo
```

#### 安装 NVIDIA 容器工具包

```bash
export NVIDIA_CONTAINER_TOOLKIT_VERSION=1.18.1-1
sudo dnf install -y \
    nvidia-container-toolkit-${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
    nvidia-container-toolkit-base-${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
    libnvidia-container-tools-${NVIDIA_CONTAINER_TOOLKIT_VERSION} \
    libnvidia-container1-${NVIDIA_CONTAINER_TOOLKIT_VERSION}
```

### 生成配置

```
sudo nvidia-ctk runtime configure --runtime=docker
```

### 重启 Docker 服务

```
sudo systemctl restart docker
```

## 构建和运行容器

参考 [MinerU Docker 部署](https://opendatalab.github.io/MinerU/zh/quick_start/docker_deployment/)

### 1. 构建镜像

[Dockerfile](https://github.com/opendatalab/MinerU/blob/master/docker/china/Dockerfile) 默认使用 `vllm/vllm-openai:v0.10.1.1` 作为基础镜像， 该版本支持的显卡型号有限。

```bash
wget https://gcore.jsdelivr.net/gh/opendatalab/MinerU@master/docker/china/Dockerfile
docker build -t mineru:latest -f Dockerfile .
```

### 2. 启动服务

官方提供了 [compose.yml](https://github.com/opendatalab/MinerU/blob/master/docker/compose.yaml) 文件，可以通过它来快速启动 MinerU 服务。

```bash
wget https://gcore.jsdelivr.net/gh/opendatalab/MinerU@master/docker/compose.yaml
```

启动 Web API 服务，在浏览器中访问 `http://<server_ip>:8000/docs` 查看 API 文档。

```bash
docker compose -f compose.yaml --profile api up -d
```

## 使用 API

### 1. SDK 封装

```python
import io
import requests
from typing import Iterable, Tuple, Union, BinaryIO, Optional


# 支持的文件输入形式
FileInput = Union[
    bytes,                  # raw bytes
    Tuple[str, bytes],      # (filename, bytes)
    BinaryIO,               # file-like object
]


class PdfParseClient:
    def __init__(self, base_url: str, timeout: int = 300):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def parse(
        self,
        files: Iterable[FileInput],
        *,
        backend: Optional[str] = None,
        parse_method: Optional[str] = None,
        lang_list: Optional[list[str]] = None,
        return_images: bool = False,
        response_format_zip: bool = False,
    ):
        """
        Minimal /file_parse wrapper

        :param files: binary file inputs
        :param backend: pipeline | vlm-* | hybrid-*
        :param parse_method: auto | txt | ocr
        :param lang_list: OCR language list
        :param return_images: return extracted images
        :param response_format_zip: return ZIP instead of JSON
        """

        url = f"{self.base_url}/file_parse"

        multipart_files = []
        opened = []

        for i, f in enumerate(files):
            if isinstance(f, bytes):
                bio = io.BytesIO(f)
                multipart_files.append(
                    ("files", (f"file_{i}.bin", bio))
                )
                opened.append(bio)

            elif isinstance(f, tuple):
                name, data = f
                bio = io.BytesIO(data)
                multipart_files.append(("files", (name, bio)))
                opened.append(bio)

            elif hasattr(f, "read"):
                name = getattr(f, "name", f"file_{i}.bin")
                multipart_files.append(("files", (name, f)))

            else:
                raise TypeError(f"Unsupported file type: {type(f)}")

        data = {}
        if backend:
            data["backend"] = backend
        if parse_method:
            data["parse_method"] = parse_method
        if lang_list:
            data["lang_list"] = lang_list
        if return_images:
            data["return_images"] = "true"
        if response_format_zip:
            data["response_format_zip"] = "true"

        resp = requests.post(
            url,
            files=multipart_files,
            data=data,
            timeout=self.timeout,
        )

        for f in opened:
            try:
                f.close()
            except Exception:
                pass

        resp.raise_for_status()

        if "application/zip" in resp.headers.get("Content-Type", ""):
            return resp.content

        return resp.json()
```

### 直接传二进制

```python
from pdf_parse_sdk import PdfParseClient

client = PdfParseClient("http://127.0.0.1:8000")

with open("demo.pdf", "rb") as f:
    result = client.parse(
        files=[("demo.pdf", f.read())],
        return_images=True,
        backend="pipeline",
    )

print(result)
```

### 内存流

```python
from io import BytesIO

result = client.parse(
    files=[BytesIO(pdf_bytes)],
    backend="pipeline",
    parse_method="ocr",
)
```

### ZIP 返回

```python
zip_bytes = client.parse(
    files=[("paper.pdf", pdf_bytes)],
    backend="hybrid-http-client",
    response_format_zip=True,
)

with open("result.zip", "wb") as f:
    f.write(zip_bytes)
```
