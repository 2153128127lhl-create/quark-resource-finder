# 夸克网盘直搜（在线部署版）

这个项目是静态前端 + Cloudflare Pages Function。网页通过 `/api/search` 请求后端函数，再由函数调用盘搜索公开 API，避免浏览器直接请求第三方 API 时遇到 CORS 问题。

## 数据源
- API 文档：https://pansousuo.com/api-docs
- 搜索端点：`GET https://pansousuo.com/api/search?q=关键词&pan=quark&p=1`
- API 文档说明：索引库查询无需注册；`src=remote` 需要配置采集引擎，因此本项目默认使用已收录的索引，不承诺实时全网搜索。
- 上游 API 的使用条款、速率限制、稳定性和结果覆盖率由服务方决定。正式公开上线前，请检查其条款与商业用途限制。

## 最容易的部署方式：Cloudflare Pages（免费计划起步）
1. 将整个项目文件夹上传到你自己的 GitHub 仓库（GitHub 账户需由你自己创建）。
2. 登录 Cloudflare Dashboard，打开 Workers & Pages，创建 Pages 项目并连接该 GitHub 仓库。
3. Framework preset 选 `None`。
4. Build command 留空；Build output directory 填 `public`。
5. 部署。Cloudflare Pages 会识别根目录的 `functions/api/search.js` 并部署为 `/api/search` 函数。
6. 打开 Cloudflare 提供的 `*.pages.dev` 地址，输入关键词测试。
7. 如果要绑定自己的域名，可在 Pages 项目里添加自定义域名；域名通常需要另行购买。

## 本地预览（可选）
安装 Node.js 后，在项目目录执行：
`npx wrangler pages dev public`
注意：为了让 Pages Functions 生效，Wrangler 需要从项目根目录读取 `functions` 目录。若 CLI 版本行为有差异，参考 Cloudflare Pages Functions 官方文档。

## 限制
- 上游 API 返回的是它索引到的资源，不是夸克官方 API，也不是完整全网爬取。
- 结果可能过期、失效或缺少提取码；不保证可用性。
- 不抓取需要登录的私人网盘，不保存账号密码，不绕过访问控制。
- 搜索词会被发送给第三方 API。
- 如用于公开商业项目，应先确认上游授权和版权合规要求。
