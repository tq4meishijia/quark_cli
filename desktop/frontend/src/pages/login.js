/**
 * login.js —— 登录授权页。
 *
 * 夸克网盘没有面向第三方应用的 OAuth 授权入口，凭证沿用 CLI 的做法：
 * 用户在浏览器登录网盘后从开发者工具里复制 Cookie，粘贴到这里。
 * 因此本页的重点是「把怎么拿到 Cookie 讲清楚」，而不是做一个假授权按钮。
 */
import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { bridge, bridgeMode } from '../bridge/index.js';
import { toastError } from '../components/toast.js';

const STEPS = [
  '用浏览器打开 pan.quark.cn 并完成登录',
  '按 F12 打开开发者工具，切到 Network（网络）面板',
  '刷新页面，任选一条 drive-pc.quark.cn 的请求',
  '在请求头里复制 Cookie 整段内容，粘贴到下方输入框',
];

/**
 * @param {object} opts
 * @param {(auth:object)=>void} opts.onSuccess 登录成功回调
 * @returns {{node: HTMLElement}}
 */
export function loginPage({ onSuccess }) {
  const isMock = bridgeMode() === 'mock';

  const input = h('textarea', {
    class: 'textarea input--mono',
    placeholder: '在此粘贴 Cookie，例如 __pus=xxxx; __puus=yyyy;',
    spellcheck: 'false',
  });

  const error = h('div', { class: 'field__error hidden' });

  const submitBtn = h(
    'button',
    { class: 'btn btn--primary btn--block', type: 'button' },
    icon('check', 15),
    h('span', { text: '登录' })
  );

  const envBtn = h(
    'button',
    { class: 'btn btn--block', type: 'button' },
    icon('harddrive', 15),
    h('span', { text: '从环境变量读取' })
  );

  const setBusy = (busy, text) => {
    submitBtn.disabled = busy;
    envBtn.disabled = busy;
    const label = submitBtn.querySelector('span');
    if (label) label.textContent = text || '登录';
  };

  const showError = (msg) => {
    error.textContent = msg;
    error.classList.remove('hidden');
  };
  const clearError = () => {
    error.textContent = '';
    error.classList.add('hidden');
  };

  const doLogin = async (raw, source) => {
    clearError();
    const value = String(raw || '').trim();
    if (!value && source === 'manual') {
      showError('请先粘贴 Cookie');
      input.focus();
      return;
    }
    setBusy(true, '正在登录…');
    try {
      const auth = source === 'env' ? await bridge().auth.loginEnv() : await bridge().auth.login(value);
      if (onSuccess) onSuccess(auth);
    } catch (err) {
      showError(err && err.message ? err.message : '登录失败');
      toastError(err, '登录失败');
    } finally {
      setBusy(false);
    }
  };

  submitBtn.addEventListener('click', () => doLogin(input.value, 'manual'));
  envBtn.addEventListener('click', () => doLogin('', 'env'));
  input.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter 提交，避免与换行冲突
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) doLogin(input.value, 'manual');
  });

  const card = h(
    'div',
    { class: 'login__card' },
    h(
      'div',
      { class: 'login__brand' },
      h('div', { class: 'brand__mark', text: 'QK' }),
      h(
        'div',
        { class: 'col' },
        h('div', { class: 'login__title', text: '夸克网盘桌面版' }),
        h('div', { class: 'brand__sub', text: isMock ? '预览模式（mock 数据）' : '已连接本地服务' })
      )
    ),

    h('div', {
      class: 'login__desc',
      text: '本客户端是非官方第三方工具，不提供账号密码登录，也不上传你的凭证到任何服务器：Cookie 只保存在本机配置目录，权限 0600。',
    }),

    h(
      'div',
      { class: 'field' },
      h('label', { class: 'field__label', text: '会话 Cookie' }),
      input,
      error,
      h('div', {
        class: 'field__hint',
        text: isMock
          ? '当前是预览模式，任意填写 4 个字符以上即可进入界面查看效果。'
          : '凭证会写入本机配置文件；也可设置 KUAKE_COOKIE 后用下方按钮直接读取。',
      })
    ),

    h('div', { class: 'col', style: { gap: 'var(--sp-2)' } }, submitBtn, envBtn),

    h(
      'div',
      { class: 'login__steps' },
      h('div', { style: { fontWeight: '600', marginBottom: '2px' }, text: '如何获取 Cookie' }),
      ...STEPS.map((s, i) => h('div', { text: i + 1 + '. ' + s }))
    ),

    h('div', {
      class: 'login__footer',
      text: '使用本工具即表示你已了解相关风险：账号凭证可能失效，接口变更可能导致不可用。',
    })
  );

  return { node: h('div', { class: 'login' }, card) };
}
