"""
测试DeepSeek API配置
"""
import requests
import json

# 配置DeepSeek
config = {
    "endpoint": "https://api.deepseek.com/v1",
    "model": "deepseek-chat",
    "model_routes": {
        "planner": "deepseek-chat",
        "writer": "deepseek-chat",
        "reviewer": "deepseek-chat",
        "assistant": "deepseek-chat"
    },
    "api_key": input("请输入你的DeepSeek API密钥 (sk-开头): "),
    "api_enabled": True,
    "clear_api_key": False,
    "temperature": 0.7,
    "max_tokens": 2000
}

print("\n正在配置DeepSeek API...")
response = requests.post("http://127.0.0.1:8000/api/llm/config", json=config)

if response.status_code == 200:
    result = response.json()
    print("✅ 配置成功！")
    print(f"   端点: {result['endpoint']}")
    print(f"   模型: {result['model']}")
    print(f"   API密钥已设置: {result['api_key_set']}")
    print(f"   API已启用: {result['api_enabled']}")

    # 测试AI功能
    print("\n正在测试AI对话...")
    test_data = {
        "messages": [
            {"role": "user", "content": "你好，请用一句话介绍你自己"}
        ],
        "context": {
            "workspace": "test"
        }
    }

    test_response = requests.post("http://127.0.0.1:8000/api/ai/chat", json=test_data)

    if test_response.status_code == 200:
        ai_result = test_response.json()
        print("✅ AI响应成功！")
        print(f"\nAI回复: {ai_result['response']}")
        print("\n🎉 所有测试通过！DeepSeek API配置成功！")
    else:
        print(f"❌ AI测试失败: {test_response.text}")
else:
    print(f"❌ 配置失败: {response.text}")
