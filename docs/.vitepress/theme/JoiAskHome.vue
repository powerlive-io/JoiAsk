<template>
  <main id="main-content" class="ask-home">
    <section class="ask-hero" aria-labelledby="hero-title">
      <div class="ask-intro">
        <p class="ask-eyebrow">POWERLIVE / JOIASK</p>
        <h1 id="hero-title">让好问题，<br>有处可留。</h1>
        <p class="ask-description">从观众的一个问题，到值得留下的对话。<br class="desktop-break">用自己的提问箱，收集、整理和分享每一份好奇。</p>
        <div class="ask-actions">
          <a class="ask-button" href="/guide/quick-start.html">搭建提问箱 <span aria-hidden="true">↗</span></a>
          <a class="ask-text-link" href="https://ask.vjoi.cn/" target="_blank" rel="noreferrer">体验在线示例 <span aria-hidden="true">↗</span></a>
        </div>
        <p class="ask-caption">开源、自行部署，内容和数据由你掌握。</p>
      </div>
      <div class="ask-workflow" aria-label="提问箱工作流">
        <div class="ask-workflow-heading"><span>一个问题的旅程</span><span class="ask-status">JoiAsk</span></div>
        <div class="ask-question">
          <span class="ask-step">01 / 收集提问</span>
          <p>「下一次直播，<br>可以聊聊你的创作过程吗？」</p>
          <span class="ask-question-note">文字、图片，还有一点好奇心。</span>
        </div>
        <div class="ask-workflow-grid">
          <div><span class="ask-step">02 / 整理内容</span><h2>按话题分类</h2><p>让不同的讨论各有归处。</p></div>
          <div class="ask-review"><span class="ask-step">03 / 审核展示</span><h2>认真选，放心聊</h2><p>由管理员审核投稿内容。</p></div>
        </div>
        <div class="ask-archive"><div><span class="ask-step">04 / 留存对话</span><h2>归档成卡片，随时回看。</h2></div><span aria-hidden="true">↗</span></div>
      </div>
    </section>

    <div class="ask-band" aria-label="项目特点">
      <span>图文投稿</span><span>话题分类</span><span>内容审核</span><span>卡片归档</span><span>开放源码</span>
    </div>

    <section class="ask-guides" aria-labelledby="guides-title">
      <div class="ask-guides-heading">
        <p class="ask-eyebrow">使用文档</p>
        <h2 id="guides-title">从搭建到日常使用。<br>一步一步，找到答案。</h2>
        <p>第一次部署，或是回来查一个配置，<br>从这里找到需要的说明。</p>
      </div>
      <a class="ask-guide-row" href="/guide/quick-start.html">
        <span class="ask-guide-label">开始</span><div><h3>搭建你的提问箱</h3><p>用 Docker 启动服务，准备持久化目录，创建第一个管理员。</p></div><span class="ask-row-arrow" aria-hidden="true">↗</span>
      </a>
      <a class="ask-guide-row" href="/guide/configuration.html">
        <span class="ask-guide-label">配置</span><div><h3>让部署稳定、安全</h3><p>了解数据库、图片存储、Session 密钥与 HTTPS 配置。</p></div><span class="ask-row-arrow" aria-hidden="true">↗</span>
      </a>
      <a class="ask-guide-row" href="/guide/usage.html">
        <span class="ask-guide-label">使用</span><div><h3>给互动多一点表达</h3><p>使用投稿格式标签，配置邮箱服务，调整提问箱的外观。</p></div><span class="ask-row-arrow" aria-hidden="true">↗</span>
      </a>
      <a class="ask-guide-row" href="/guide/administrators.html">
        <span class="ask-guide-label">维护</span><div><h3>管理账号与恢复访问</h3><p>了解管理员角色、离线密码恢复，以及升级时需要注意的事。</p></div><span class="ask-row-arrow" aria-hidden="true">↗</span>
      </a>
    </section>

    <section class="ask-preview" aria-labelledby="preview-title">
      <div><p class="ask-eyebrow">提问箱一览</p><h2 id="preview-title">把观众的好奇，<br>放在一起。</h2><p>话题、投稿、归档，在自己的站点里有序呈现。</p><a class="ask-text-link" href="https://ask.vjoi.cn/" target="_blank" rel="noreferrer">打开示例站点 <span aria-hidden="true">↗</span></a></div>
      <img src="/screenshot.png" alt="JoiAsk 提问箱示例：话题导航与观众提问卡片" width="2686" height="1254" loading="lazy">
    </section>

    <section class="ask-source">
      <h2>你的提问箱，<br>也可以由你一起完善。</h2>
      <a href="https://github.com/powerlive-io/JoiAsk">在 GitHub 查看源码 <span aria-hidden="true">↗</span></a>
    </section>
  </main>
</template>
