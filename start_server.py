#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
台球瞄准训练器启动脚本
启动本地HTTP服务器以运行网页应用
"""

import http.server
import socketserver
import socket
import webbrowser
import os
import sys
from pathlib import Path

def get_ip():
    """获取本机IP地址"""
    try:
        # 创建一个UDP套接字
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # 连接一个公共的DNS服务器（这里不会真正建立连接）
        s.connect(("8.8.8.8", 80))
        # 获取本机IP
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

# 设置服务器参数
PORT = 8008
Handler = http.server.SimpleHTTPRequestHandler

# 获取本机IP
local_ip = get_ip()

# 检查文件是否存在
required_files = ['index.html', 'styles.css', 'script.js']
missing_files = []

for file in required_files:
    if not Path(file).exists():
        missing_files.append(file)

if missing_files:
    print(f"❌ 缺少必要文件: {', '.join(missing_files)}")
    sys.exit(1)

# 创建服务器，允许局域网访问
with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    print(f"\n台球瞄准训练器服务器已启动！")
    print(f"\n请在手机浏览器中访问以下地址：")
    print(f"http://{local_ip}:{PORT}")
    print("\n如果使用电脑访问，可以使用以下地址：")
    print(f"http://localhost:{PORT}")
    print(f"http://127.0.0.1:{PORT}")
    print("\n按Ctrl+C停止服务器")
    
    # 在电脑默认浏览器中打开
    webbrowser.open(f"http://localhost:{PORT}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止")
    except OSError as e:
        if e.errno == 98:
            print(f"❌ 端口 {PORT} 已被占用，请尝试其他端口或关闭占用该端口的程序")
        else:
            print(f"❌ 启动服务器时出错: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 