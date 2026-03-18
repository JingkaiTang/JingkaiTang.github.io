---
title: "我用小龙虾发布微信公众号文章"
description: "记录使用 wechat-publisher skill 和 wenyan-cli 发布微信公众号文章的完整流程"
cover: ./cover.jpg
pubDate: "2026-03-18"
tags: ["ai", "openclaw", "微信公众号"]

draft: false
by:
  role: coauthored
  name: 唐靖凯
  note: "主人提供要点，获麟整理成文"
source:
  kind: original
---

# 我用小龙虾发布微信公众号文章

之前我搭了小龙虾（获麟），让他能够自己维护我的 GitHub Pages 个人主页项目：我提需求，他从开发到部署闭环。

后来想把文章转到微信公众号上，我就直接让获麟手搓了一个 skill，结果排版非常混乱😅

就是这篇文章：[我雇了个 AI 打工人：一次跑通 GitHub Pages + PR + CI 的完整工作流](https://mp.weixin.qq.com/s/40zRuP1yNp5M64GgfTqnxw)

后来我找到一个 skill：wechat-publisher（Wechat Publisher），基于 `wenyan-cli` 实现发布 markdown 文档到微信公众号草稿箱功能

- skill 地址：https://clawhub.ai/0731coderlee-sudo/wechat-publisher
- GitHub 地址：https://github.com/0731coderlee-sudo/wechat-publisher
- wenyan-cli 的 GitHub 地址：https://github.com/caol64/wenyan-cli

## 安装之前

在开始之前必须强调：安装 skill 有风险，请仔细甄别

另外，需要准备以下物料：
- 微信公众号 x1
- 稳定出口 IP x1 接入微信公众号 API 需要

## 安装 `wechat-publisher`

第一步也是最简单的一步，直接让你的小龙虾安装这个 skill 就行

人类就不要凑热闹了

## 安装 `wenyan-cli`

wechat-publisher 依赖命令行工具 `wenyan-cli`，所以安装完 skill 后首先要安装 `wenyan-cli`

在 wechat-publisher 的 skill 中会自动检测并安装 `wenyan-cli`，也可以提前安装好

你完全可以直接交给你的小龙虾来操作🤓

对于人类来说，你应该这样进行安装：

```bash
npm install -g @wenyan-md/cli
```

安装完毕后，可以直接使用来测试下：

```bash
wenyan --help
```

## 配置微信凭证与 IP 白名单

自动发文章到公众号需要接入对应的 API，而接入 API 就需要获取微信公众号的 `APP_ID`、`APP_SECRET` 和配置 IP 白名单

这一步人类的参与感极强，至少得扫个码吧

登录微信开发者平台，登录你的账号，找到你的公众号
微信开发者账号地址：https://developers.weixin.qq.com/

相关位置我都在下图上做了标记

![微信公众号配置](./Pasted%20image%2020260318215805.png)

拿到你的 `APP_ID`、`APP_SECRET`，没配置过 `APP_SECRET` 的需要创建，如果配置过且忘记了则需要重置（重置前，请确认没有在使用的服务，谨慎操作）
wechat-publisher skill 推荐你把 `APP_ID`、`APP_SECRET` 配置到 `TOOL.md` 里，但我不太推荐这么做，这样会把凭证暴露给其他工具。
你可以在你家目录创建一个 `.wechat_credentials.txt` 的文件，把你的 `APP_ID`、`APP_SECRET` 填进去，然后让你的小龙虾改造一下 skill，从这个文件里读取。

```bash
# ~/.wechat_credentials.txt
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
```

配置 API 的 IP 白名单的话，首先你需要一个公网 IP，不一定要独占，但要出口 IP 一定要稳定。
对于云服务器养龙虾的朋友来说，有个天然的优势，要么有公网地址，要么出口 IP 相对稳定；本地部署的话，可以考虑通过云服务器转发微信 api 的域名 `api.weixin.qq.com`，也能达到相同效果。

## 发布文章

上面的操作结束后，就可以测试你的 skill 了。

如果你已经写好了文章，可以让小龙虾帮你通过 skill 搬运到微信公众号上。

如果没有写，你甚至可以给你的小龙虾发文案、发图片，并且让他帮你整理优化文章，最后发布（我就经常这么干

![发布流程](./Pasted%20image%2020260318225555.png)

当然，这个 skill 只能帮你把文章发到微信公众号的草稿箱，最后还是需要你去公众号或者公众助手上确认点击发布的。

工具 `wenyan-cli` 还支持不同的主题，可以一一尝试下看看。

```
$ wenyan theme -l                                                               
内置主题：                                                                                            
- default: A clean, classic layout ideal for long-form reading.                                       
- orangeheart: A vibrant and elegant theme in warm orange tones.                                      
- rainbow: A colorful, lively theme with a clean layout.                                              
- lapis: A minimal and refreshing theme in cool blue tones.                                           
- pie: Inspired by sspai.com and Misty — modern, sharp, and stylish.                                  
- maize: A crisp, light theme with a soft maize palette.                                              
- purple: Clean and minimalist, with a subtle purple accent.                                          
- phycat: 物理猫 - 薄荷：a mint-green theme with clear structure and hierarchy.
```
