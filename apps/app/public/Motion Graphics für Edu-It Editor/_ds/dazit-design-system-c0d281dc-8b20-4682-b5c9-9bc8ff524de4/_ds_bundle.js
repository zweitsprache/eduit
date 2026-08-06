/* @ds-bundle: {"format":4,"namespace":"DazitDesignSystem_c0d281","components":[{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"WorksheetCard","sourcePath":"components/data-display/WorksheetCard.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Icon","sourcePath":"components/icon/Icon.jsx"},{"name":"Pagination","sourcePath":"components/navigation/Pagination.jsx"}],"sourceHashes":{"components/core/Avatar.jsx":"1798f3cf793b","components/core/Badge.jsx":"928e4c844ae9","components/core/Button.jsx":"cbf0b4b8b450","components/data-display/WorksheetCard.jsx":"e404580d4390","components/feedback/Modal.jsx":"ffe95bf1da3d","components/forms/Checkbox.jsx":"50eb280a7601","components/forms/Input.jsx":"61ac7d80a4e1","components/forms/Select.jsx":"e218f125e52b","components/forms/Switch.jsx":"18e15d08377a","components/icon/Icon.jsx":"7d1c1238f84d","components/navigation/Pagination.jsx":"ddabacd41381","ui_kits/dazit-library/App.jsx":"f7a32778920f","ui_kits/dazit-library/AuthScreen.jsx":"99a4da3b2dce","ui_kits/dazit-library/DetailScreen.jsx":"9535c772ad08","ui_kits/dazit-library/Header.jsx":"d84fc71f221b","ui_kits/dazit-library/HomeScreen.jsx":"84952a27324e","ui_kits/dazit-library/LibraryScreen.jsx":"58d139f69efb","ui_kits/dazit-library/data.js":"90bc0c792885"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.DazitDesignSystem_c0d281 = window.DazitDesignSystem_c0d281 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
const tones = ['lavender', 'peach', 'blue', 'blue-light', 'green', 'green-light', 'orange', 'orange-light', 'mint', 'yellow', 'pink'];
function Badge({
  tone = 'lavender',
  children,
  solid = true
}) {
  const t = tones.includes(tone) ? tone : 'lavender';
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 9px',
      borderRadius: 'var(--radius-pill)',
      background: `var(--tint-${t}-bg)`,
      color: `var(--tint-${t}-ink)`,
      fontSize: 10,
      fontWeight: 'var(--fw-black)',
      textTransform: 'uppercase',
      letterSpacing: '.02em',
      fontFamily: 'var(--font-sans)',
      opacity: solid ? 1 : 0.85
    }
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked = false,
  onChange,
  children
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      color: 'var(--text-primary)',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("input", {
    checked: checked,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0
    },
    type: "checkbox"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'relative',
      width: 35,
      height: 20,
      borderRadius: 'var(--radius-pill)',
      background: checked ? 'var(--accent)' : '#d9dae0',
      transition: `background var(--duration-fast) var(--ease-standard)`,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      top: 3,
      left: checked ? 18 : 3,
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: '#fff',
      transition: `left var(--duration-fast) var(--ease-standard)`
    }
  })), children);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/icon/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Path data copied from the Lucide icon set (ISC licensed), used as the
// dazit design system's substitute for the product's @untitledui/icons set
// (not reliably CDN-loadable from a sandboxed component). Same 24px grid,
// 2px stroke, rounded caps/joins as the source icons.
const ICONS = {
  search: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "m21 21-4.34-4.34"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "8"
  })),
  filter: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M10 5H3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 19H3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 3v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 17v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 12h-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 19h-5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 5h-7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 10v4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 12H3"
  })),
  download: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 15V3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m7 10 5 5 5-5"
  })),
  file: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 2v5a1 1 0 0 0 1 1h5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 9H8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 13H8"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 17H8"
  })),
  grid: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    width: "18",
    height: "18",
    x: "3",
    y: "3",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 9h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 15h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 3v18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15 3v18"
  })),
  list: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M3 5h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 12h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 19h.01"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 5h13"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 12h13"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 19h13"
  })),
  close: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M18 6 6 18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "m6 6 12 12"
  })),
  check: /*#__PURE__*/React.createElement("path", {
    d: "M20 6 9 17l-5-5"
  }),
  plus: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M5 12h14"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14"
  })),
  trash: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M10 11v6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 11v6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 6h18"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
  })),
  user: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "7",
    r: "4"
  })),
  chevronLeft: /*#__PURE__*/React.createElement("path", {
    d: "m15 18-6-6 6-6"
  }),
  chevronRight: /*#__PURE__*/React.createElement("path", {
    d: "m9 18 6-6-6-6"
  }),
  layers: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"
  })),
  copy: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    width: "14",
    height: "14",
    x: "8",
    y: "8",
    rx: "2",
    ry: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"
  })),
  loading: /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 1 1-6.219-8.56"
  })
};
function Icon({
  name,
  size = 20,
  strokeWidth = 2,
  className,
  style,
  ...rest
}) {
  const body = ICONS[name];
  if (!body) return null;
  return /*#__PURE__*/React.createElement("svg", _extends({
    "aria-hidden": "true",
    className: className,
    fill: "none",
    height: size,
    stroke: "currentColor",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    strokeWidth: strokeWidth,
    style: {
      display: 'block',
      flexShrink: 0,
      ...style
    },
    viewBox: "0 0 24 24",
    width: size
  }, rest), body);
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icon/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function Avatar({
  initials,
  onClick,
  label = 'Konto'
}) {
  return /*#__PURE__*/React.createElement("button", {
    "aria-label": label,
    onClick: onClick,
    style: {
      display: 'grid',
      width: 36,
      height: 36,
      placeItems: 'center',
      border: 0,
      borderRadius: '50%',
      background: '#e9e9ef',
      color: 'var(--navy)',
      fontWeight: 'var(--fw-black)',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      cursor: 'pointer'
    },
    type: "button"
  }, initials ? initials.slice(0, 2).toUpperCase() : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "user",
    size: 17
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
const sizes = {
  sm: {
    height: 36,
    padding: '0 13px',
    fontSize: 13
  },
  md: {
    height: 44,
    padding: '0 20px',
    fontSize: 15
  },
  lg: {
    height: 54,
    padding: '0 24px',
    fontSize: 18
  }
};
const base = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  border: '1px solid transparent',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 'var(--fw-black)',
  cursor: 'pointer',
  transition: `background var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)`
};
function variantStyle(variant) {
  if (variant === 'primary') return {
    background: 'var(--accent)',
    color: '#fff',
    borderColor: 'var(--accent)'
  };
  if (variant === 'ghost') return {
    background: 'transparent',
    color: 'var(--text-primary)',
    borderColor: 'transparent'
  };
  return {
    background: '#fff',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-strong)'
  };
}
function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  children,
  onClick,
  type = 'button',
  style
}) {
  const [hover, setHover] = React.useState(false);
  const variantSt = variantStyle(variant);
  const hoverSt = !disabled && hover ? variant === 'primary' ? {
    background: 'var(--accent-hover)',
    borderColor: 'var(--accent-hover)'
  } : {
    borderColor: 'var(--accent)',
    color: 'var(--accent)'
  } : {};
  return /*#__PURE__*/React.createElement("button", {
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      ...base,
      ...sizes[size],
      ...variantSt,
      ...hoverSt,
      opacity: disabled ? 0.55 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      ...style
    },
    type: type
  }, icon && iconPosition === 'left' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'lg' ? 20 : 16
  }), children, icon && iconPosition === 'right' && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === 'lg' ? 20 : 16
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/data-display/WorksheetCard.jsx
try { (() => {
function WorksheetCard({
  title,
  documentType = 'Arbeitsblatt',
  tone = 'lavender',
  description,
  pages = 1,
  downloads = 0,
  hasAnswerKey = false,
  thumbnailUrl,
  canDownload = false,
  onDelete
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("article", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
      overflow: 'hidden',
      border: '1px solid #d2d3d8',
      borderRadius: 'var(--radius-lg)',
      background: '#fff',
      boxShadow: hover ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
      transform: hover ? 'translateY(-2px)' : 'none',
      transition: `transform var(--duration-fast) var(--ease-standard), box-shadow var(--duration-fast) var(--ease-standard)`,
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flex: 1,
      flexDirection: 'column',
      padding: '14px 14px 12px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minHeight: 22,
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    tone: tone
  }, documentType), hasAnswerKey && /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#2e815d',
      fontSize: 11,
      fontWeight: 'var(--fw-bold)',
      whiteSpace: 'nowrap'
    }
  }, "\u2713 Mit L\xF6sungsblatt")), /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '7px 0 4px',
      fontSize: 16,
      lineHeight: 1.25,
      color: 'var(--navy)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'flex',
      aspectRatio: '16 / 9',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      background: `var(--tint-${tone}-bg)`,
      color: `var(--tint-${tone}-ink)`,
      fontSize: 12,
      borderRadius: 7,
      overflow: 'hidden',
      border: '1px solid #d9dbe4',
      margin: '8px 0 0'
    }
  }, thumbnailUrl ? /*#__PURE__*/React.createElement("img", {
    alt: "",
    src: thumbnailUrl,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'top'
    }
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "file",
    size: 28
  }), /*#__PURE__*/React.createElement("span", null, "16:9 Vorschau"))), /*#__PURE__*/React.createElement("p", {
    style: {
      display: '-webkit-box',
      overflow: 'hidden',
      minHeight: 38,
      margin: '7px 0 0',
      color: '#656875',
      fontSize: 12,
      lineHeight: 1.55,
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: 2
    }
  }, description), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: onDelete ? '1fr auto auto auto' : '1fr auto auto',
      alignItems: 'center',
      gap: 12,
      marginTop: 'auto',
      paddingTop: 17
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      color: '#8c8e99',
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "layers",
    size: 13
  }), pages), /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      color: '#8c8e99',
      fontSize: 11
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "download",
    size: 13
  }), downloads)), onDelete && /*#__PURE__*/React.createElement("button", {
    "aria-label": "l\xF6schen",
    onClick: onDelete,
    style: {
      display: 'flex',
      width: 30,
      height: 30,
      padding: 0,
      alignItems: 'center',
      justifyContent: 'center',
      border: 0,
      background: 'transparent',
      color: '#8c8e99',
      cursor: 'pointer'
    },
    type: "button"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "trash",
    size: 15
  })), /*#__PURE__*/React.createElement("button", {
    style: {
      width: 84,
      textAlign: 'center',
      border: '1px solid #b7b8c0',
      borderRadius: 'var(--radius-md)',
      background: '#fff',
      padding: '8px 13px',
      fontWeight: 'var(--fw-black)',
      fontSize: 13,
      color: 'var(--navy)',
      cursor: 'pointer'
    },
    type: "button"
  }, "Details"), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Download",
    disabled: !canDownload,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #b7b8c0',
      borderRadius: 'var(--radius-md)',
      background: '#fff',
      padding: '8px 13px',
      color: 'var(--navy)',
      cursor: canDownload ? 'pointer' : 'default'
    },
    type: "button"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "download",
    size: 16
  })))));
}
Object.assign(__ds_scope, { WorksheetCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data-display/WorksheetCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
function Modal({
  open,
  onClose,
  title,
  children
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onMouseDown: e => {
      if (e.target === e.currentTarget) onClose && onClose();
    },
    role: "dialog",
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 130,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'rgb(23 25 39 / 58%)',
      backdropFilter: 'blur(2px)'
    }
  }, /*#__PURE__*/React.createElement("section", {
    "aria-modal": "true",
    style: {
      width: 'min(100%, 560px)',
      maxHeight: 'min(88vh, 760px)',
      overflow: 'auto',
      border: '1px solid #d5d6dd',
      borderRadius: 'var(--radius-3xl)',
      background: '#fff',
      boxShadow: 'var(--shadow-modal)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 18px 12px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 20,
      lineHeight: 1.2,
      color: 'var(--navy)'
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Modal schlie\xDFen",
    onClick: onClose,
    style: {
      display: 'flex',
      width: 34,
      height: 34,
      padding: 0,
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #d6d7df',
      borderRadius: 'var(--radius-lg)',
      background: '#fff',
      color: '#6c6f7f',
      cursor: 'pointer'
    },
    type: "button"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "close",
    size: 16
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 18px 18px'
    }
  }, children)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked = false,
  onChange,
  children,
  count
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'grid',
      gridTemplateColumns: '22px 1fr auto',
      alignItems: 'center',
      gap: 8,
      minHeight: 32,
      color: '#454755',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'grid',
      placeItems: 'center',
      width: 19,
      height: 19,
      border: `1.5px solid ${checked ? 'var(--navy)' : 'var(--border-strong)'}`,
      borderRadius: 4,
      background: checked ? 'var(--navy)' : '#fff'
    }
  }, checked && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    style: {
      color: '#fff'
    },
    strokeWidth: 3
  })), /*#__PURE__*/React.createElement("input", {
    checked: checked,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: 'absolute',
      opacity: 0,
      width: 1,
      height: 1
    },
    type: "checkbox"
  }), /*#__PURE__*/React.createElement("span", null, children), count != null && /*#__PURE__*/React.createElement("small", {
    style: {
      color: '#9698a3'
    }
  }, count));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  icon = 'search',
  placeholder,
  value,
  onChange,
  ariaLabel,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 44,
      padding: '0 14px',
      border: '1px solid var(--border-strong)',
      borderRadius: 'var(--radius-md)',
      background: '#fff',
      ...style
    }
  }, icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    style: {
      color: 'var(--text-faint)'
    }
  }), /*#__PURE__*/React.createElement("input", {
    "aria-label": ariaLabel,
    onChange: e => onChange && onChange(e.target.value),
    placeholder: placeholder,
    style: {
      width: '100%',
      border: 0,
      outline: 0,
      background: 'transparent',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 15
    },
    value: value
  }));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  value,
  onChange,
  options,
  ariaLabel
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("select", {
    "aria-label": ariaLabel,
    onChange: e => onChange && onChange(e.target.value),
    style: {
      height: 42,
      minWidth: 170,
      padding: '0 34px 0 12px',
      border: '1px solid #b5b6bf',
      borderRadius: 'var(--radius-md)',
      background: '#fff',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      fontSize: 14,
      appearance: 'none'
    },
    value: value
  }, options.map(opt => /*#__PURE__*/React.createElement("option", {
    key: opt.value,
    value: opt.value
  }, opt.label))), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevronRight",
    size: 14,
    style: {
      position: 'absolute',
      right: 12,
      transform: 'rotate(90deg)',
      color: 'var(--text-faint)',
      pointerEvents: 'none'
    }
  }));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Pagination.jsx
try { (() => {
function Pagination({
  page,
  pageCount,
  onChange
}) {
  const btn = {
    minHeight: 36,
    padding: '0 13px',
    border: '1px solid #b8bac2',
    borderRadius: 'var(--radius-md)',
    background: '#fff',
    color: 'var(--navy)',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--fw-black)',
    fontSize: 13,
    cursor: 'pointer'
  };
  return /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Seitennavigation",
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      color: '#686a78',
      fontFamily: 'var(--font-sans)',
      fontSize: 13,
      fontWeight: 'var(--fw-black)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    disabled: page === 1,
    onClick: () => onChange(1),
    style: {
      ...btn,
      opacity: page === 1 ? 0.4 : 1
    },
    type: "button"
  }, "Erste"), /*#__PURE__*/React.createElement("button", {
    disabled: page === 1,
    onClick: () => onChange(Math.max(1, page - 1)),
    style: {
      ...btn,
      opacity: page === 1 ? 0.4 : 1
    },
    type: "button"
  }, "Zur\xFCck"), /*#__PURE__*/React.createElement("span", null, page, " / ", pageCount), /*#__PURE__*/React.createElement("button", {
    disabled: page === pageCount,
    onClick: () => onChange(Math.min(pageCount, page + 1)),
    style: {
      ...btn,
      opacity: page === pageCount ? 0.4 : 1
    },
    type: "button"
  }, "Weiter"), /*#__PURE__*/React.createElement("button", {
    disabled: page === pageCount,
    onClick: () => onChange(pageCount),
    style: {
      ...btn,
      opacity: page === pageCount ? 0.4 : 1
    },
    type: "button"
  }, "Letzte"));
}
Object.assign(__ds_scope, { Pagination });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Pagination.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dazit-library/App.jsx
try { (() => {
function App() {
  const [screen, setScreen] = React.useState('home');
  const [worksheet, setWorksheet] = React.useState(null);
  const [initialLevel, setInitialLevel] = React.useState(null);
  const [signedIn, setSignedIn] = React.useState(false);
  const nav = (target, opts = {}) => {
    if (target === 'detail') setWorksheet(opts);
    if (target === 'library') setInitialLevel(opts.level || null);
    setScreen(target);
    window.scrollTo(0, 0);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Header, {
    active: screen === 'library' || screen === 'detail' ? 'library' : 'home',
    onNav: nav,
    showSearch: screen === 'library',
    signedIn: signedIn
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, screen === 'home' && /*#__PURE__*/React.createElement(HomeScreen, {
    onNav: nav,
    onOpenWorksheet: w => nav('detail', w)
  }), screen === 'library' && /*#__PURE__*/React.createElement(LibraryScreen, {
    initialLevel: initialLevel,
    onOpenWorksheet: w => nav('detail', w)
  }), screen === 'detail' && worksheet && /*#__PURE__*/React.createElement(DetailScreen, {
    onNav: nav,
    onRequestSignIn: () => nav('signin'),
    signedIn: signedIn,
    worksheet: worksheet
  }), screen === 'signin' && /*#__PURE__*/React.createElement(AuthScreen, {
    onSignedIn: () => {
      setSignedIn(true);
      nav('library');
    }
  })), /*#__PURE__*/React.createElement(Footer, null));
}
if (!window.__dazitRoot) window.__dazitRoot = ReactDOM.createRoot(document.getElementById('root'));
window.__dazitRoot.render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dazit-library/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dazit-library/AuthScreen.jsx
try { (() => {
function AuthScreen({
  onSignedIn
}) {
  const {
    Button
  } = window.DazitDesignSystem_c0d281;
  const [mode, setMode] = React.useState('password');
  return /*#__PURE__*/React.createElement("main", {
    style: {
      display: 'flex',
      minHeight: 560,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      background: 'var(--soft)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("section", {
    style: {
      width: 'min(100%,440px)',
      border: '1px solid #d6d8e0',
      borderRadius: 14,
      background: '#fff',
      padding: 24,
      boxShadow: 'var(--shadow-panel)'
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontSize: 28,
      lineHeight: 1.05,
      letterSpacing: '-.03em',
      color: 'var(--navy)'
    }
  }, "Anmelden"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '10px 0 0',
      color: '#6e7180',
      fontSize: 14
    }
  }, "Melde dich an, um auf deine Dokumente zuzugreifen."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8,
      marginTop: 18
    }
  }, [['password', 'Passwort'], ['otp', 'E-Mail-Code']].map(([v, label]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => setMode(v),
    style: {
      border: `1px solid ${mode === v ? 'var(--accent)' : '#ccd0db'}`,
      borderRadius: 999,
      background: mode === v ? '#fff4e9' : '#f4f5f8',
      padding: '7px 12px',
      color: mode === v ? '#8d3e00' : '#3d4356',
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer'
    }
  }, label))), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onSignedIn();
    },
    style: {
      display: 'grid',
      gap: 10,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "name@beispiel.ch",
    style: {
      width: '100%',
      height: 46,
      border: '1px solid #cfd2db',
      borderRadius: 10,
      background: '#fff',
      padding: '0 14px',
      color: '#1f2235',
      outline: 'none'
    },
    type: "email"
  }), mode === 'password' && /*#__PURE__*/React.createElement("input", {
    placeholder: "Passwort",
    style: {
      width: '100%',
      height: 46,
      border: '1px solid #cfd2db',
      borderRadius: 10,
      background: '#fff',
      padding: '0 14px',
      color: '#1f2235',
      outline: 'none'
    },
    type: "password"
  }), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    style: {
      height: 46
    },
    type: "submit",
    variant: "primary"
  }, mode === 'password' ? 'Anmelden' : 'Code senden'))));
}
Object.assign(window, {
  AuthScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dazit-library/AuthScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dazit-library/DetailScreen.jsx
try { (() => {
function DocumentGallery({
  toneName,
  pages
}) {
  const {
    Icon
  } = window.DazitDesignSystem_c0d281;
  const [active, setActive] = React.useState(0);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      aspectRatio: '16/9',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 15,
      border: '1px solid #d3cedd',
      borderRadius: 8,
      boxShadow: 'var(--shadow-card)',
      fontSize: 15,
      background: `var(--tint-${toneName}-bg)`,
      color: `var(--tint-${toneName}-ink)`
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file",
    size: 50
  }), /*#__PURE__*/React.createElement("span", null, "16:9 Vorschau \u2014 Seite ", active + 1)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      overflowX: 'auto',
      gap: 10,
      marginTop: 14,
      paddingBottom: 4
    }
  }, Array.from({
    length: pages
  }, (_, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => setActive(i),
    style: {
      flex: '0 0 auto',
      width: 42,
      height: 42,
      border: '1px solid #aeb0b9',
      borderRadius: 5,
      fontWeight: 700,
      cursor: 'pointer',
      background: i === active ? '#28293e' : '#fff',
      color: i === active ? '#fff' : 'var(--navy)'
    }
  }, i + 1))));
}
function DetailScreen({
  worksheet,
  signedIn,
  onNav,
  onRequestSignIn
}) {
  const {
    WorksheetCard,
    Badge,
    Button,
    Modal
  } = window.DazitDesignSystem_c0d281;
  const {
    WORKSHEETS,
    tone
  } = window;
  const [gateOpen, setGateOpen] = React.useState(false);
  const t = tone(worksheet.level);
  const related = WORKSHEETS.filter(w => w.slug !== worksheet.slug).slice(0, 4);
  return /*#__PURE__*/React.createElement("main", {
    style: {
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      minHeight: 66,
      alignItems: 'center',
      gap: 12,
      padding: '0 46px',
      borderBottom: '1px solid var(--line)',
      color: '#575968',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav('library');
    }
  }, "Bibliothek"), /*#__PURE__*/React.createElement("span", null, "\u203A"), /*#__PURE__*/React.createElement("strong", null, worksheet.title)), /*#__PURE__*/React.createElement("section", {
    style: {
      display: 'grid',
      maxWidth: 1500,
      gridTemplateColumns: 'minmax(0,1fr) minmax(480px,.98fr)',
      gap: 44,
      margin: '0 auto',
      padding: '44px 46px 54px'
    }
  }, /*#__PURE__*/React.createElement(DocumentGallery, {
    pages: worksheet.pages,
    toneName: t
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minHeight: 22,
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: t
  }, worksheet.documentType.toUpperCase()), worksheet.hasAnswerKey && /*#__PURE__*/React.createElement("span", {
    style: {
      color: '#2e815d',
      fontSize: 11,
      fontWeight: 700
    }
  }, "\u2713 L\xF6sungsblatt enthalten")), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: '18px 0 12px',
      fontSize: 'clamp(30px,3vw,44px)',
      lineHeight: 1.08,
      letterSpacing: '-.025em',
      color: 'var(--navy)'
    }
  }, worksheet.title), /*#__PURE__*/React.createElement("p", {
    style: {
      maxWidth: 760,
      margin: 0,
      color: '#696b79',
      fontSize: 19,
      lineHeight: 1.55
    }
  }, worksheet.description), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 12,
      margin: '22px 0'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    icon: "download",
    onClick: () => signedIn ? null : setGateOpen(true),
    size: "lg",
    variant: "primary"
  }, "PDF herunterladen")), /*#__PURE__*/React.createElement("dl", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,minmax(0,1fr))',
      margin: 0,
      borderTop: '1px solid var(--line)'
    }
  }, [['Dokumenttyp', worksheet.documentType], ['Niveau', worksheet.level], ['Seiten', worksheet.pages], ['Lösungsblatt', worksheet.hasAnswerKey ? 'enthalten' : 'nicht enthalten'], ['Downloads', worksheet.downloads], ['Format', 'PDF · A4 druckfertig']].map(([k, v], i) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: 'flex',
      justifyContent: 'space-between',
      gap: 20,
      padding: '13px 0',
      borderBottom: '1px solid var(--line)',
      marginRight: i % 2 === 0 ? 22 : 0,
      marginLeft: i % 2 === 1 ? 22 : 0
    }
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      color: '#92949f'
    }
  }, k), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0,
      fontWeight: 700,
      textAlign: 'right'
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 22,
      color: '#8b8d98'
    }
  }, worksheet.tags.map(tag => /*#__PURE__*/React.createElement("span", {
    key: tag,
    style: {
      padding: '6px 13px',
      background: '#f8f8f8',
      borderRadius: 999,
      fontSize: 13
    }
  }, tag))))), /*#__PURE__*/React.createElement("section", {
    style: {
      padding: '34px 46px 58px',
      borderTop: '1px solid var(--line)',
      background: 'var(--soft)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      maxWidth: 1500,
      margin: '0 auto 24px',
      fontSize: 27,
      color: 'var(--navy)'
    }
  }, "\xC4hnliche Dokumente"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      maxWidth: 1500,
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 24,
      margin: '0 auto'
    }
  }, related.map(w => /*#__PURE__*/React.createElement("div", {
    key: w.slug,
    onClick: () => onNav('detail', w),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(WorksheetCard, {
    canDownload: false,
    description: w.description,
    documentType: w.documentType,
    downloads: w.downloads,
    hasAnswerKey: w.hasAnswerKey,
    pages: w.pages,
    title: w.title,
    tone: tone(w.level)
  }))))), /*#__PURE__*/React.createElement(Modal, {
    onClose: () => setGateOpen(false),
    open: gateOpen,
    title: "PDF herunterladen"
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      margin: '0 0 16px',
      color: '#5c6071',
      fontSize: 14,
      lineHeight: 1.5
    }
  }, "Bitte melde dich an oder registriere dich, um dieses Dokument herunterzuladen."), /*#__PURE__*/React.createElement(Button, {
    onClick: () => {
      setGateOpen(false);
      onRequestSignIn();
    },
    variant: "primary"
  }, "Anmelden")));
}
Object.assign(window, {
  DetailScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dazit-library/DetailScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dazit-library/Header.jsx
try { (() => {
function Header({
  active = 'library',
  showSearch = false,
  signedIn,
  onNav,
  onOpenFilters
}) {
  const {
    Avatar,
    Input
  } = window.DazitDesignSystem_c0d281;
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: 'sticky',
      zIndex: 20,
      top: 0,
      display: 'grid',
      minHeight: 64,
      gridTemplateColumns: showSearch ? '220px 1fr minmax(270px,400px) 52px' : '220px 1fr 52px',
      alignItems: 'center',
      gap: 24,
      padding: '0 23px',
      borderBottom: '1px solid var(--line)',
      background: 'rgba(255,255,255,.96)',
      backdropFilter: 'blur(12px)',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav('home');
    },
    style: {
      display: 'inline-flex',
      width: 'fit-content'
    }
  }, /*#__PURE__*/React.createElement("img", {
    alt: "dazit",
    src: "../../assets/logo.svg",
    style: {
      width: 96,
      height: 'auto'
    }
  })), /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Hauptnavigation",
    style: {
      display: 'flex',
      justifyContent: 'center',
      gap: 36,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => {
      e.preventDefault();
      onNav('library');
    },
    style: {
      padding: '20px 0',
      color: active === 'library' ? 'var(--accent)' : 'var(--navy)'
    }
  }, "Bibliothek")), showSearch && /*#__PURE__*/React.createElement("label", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      height: 44,
      padding: '0 14px',
      border: '1px solid #aeb0ba',
      borderRadius: 6,
      background: '#fff'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Titel oder Stichwort suchen \u2026",
    style: {
      border: 0,
      height: 'auto',
      padding: 0
    }
  })), /*#__PURE__*/React.createElement(Avatar, {
    initials: signedIn ? 'MA' : undefined,
    label: "Admin anmelden",
    onClick: () => onNav('signin')
  }));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: 'var(--hero-blue)',
      color: '#fff',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      maxWidth: 1540,
      gridTemplateColumns: 'repeat(4,1fr)',
      gap: 40,
      margin: '0 auto',
      padding: '54px 46px 60px'
    }
  }, /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, window.TYPES.map(t => /*#__PURE__*/React.createElement("a", {
    href: "#",
    key: t,
    style: {
      color: 'rgb(255 255 255 / 82%)'
    }
  }, t === 'Arbeitsblatt' ? 'Arbeits- und Merkblätter' : t))), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, window.LEVELS.map(l => /*#__PURE__*/React.createElement("a", {
    href: "#",
    key: l,
    style: {
      color: 'rgb(255 255 255 / 82%)'
    }
  }, l))), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'rgb(255 255 255 / 82%)'
    }
  }, "Impressum"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'rgb(255 255 255 / 82%)'
    }
  }, "Datenschutzerkl\xE4rung"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    style: {
      color: 'rgb(255 255 255 / 82%)'
    }
  }, "Lizenz- und Nutzungsrecht")), /*#__PURE__*/React.createElement("address", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      color: 'rgb(255 255 255 / 82%)',
      fontStyle: 'normal',
      lineHeight: 1.45
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: '#fff'
    }
  }, "DaZit | Marcel Allenspach"), /*#__PURE__*/React.createElement("span", null, "Albisstrasse 32a"), /*#__PURE__*/React.createElement("span", null, "CH-8134 Adliswil"))));
}
Object.assign(window, {
  Header,
  Footer
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dazit-library/Header.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dazit-library/HomeScreen.jsx
try { (() => {
function CountUp({
  value
}) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let frame;
    const tick = now => {
      const p = Math.min(1, (now - start) / duration);
      setN(Math.round(value * (1 - (1 - p) ** 3)));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: 'tabular-nums',
      fontWeight: 800
    }
  }, n);
}
function HomeScreen({
  onNav,
  onOpenWorksheet
}) {
  const {
    WorksheetCard,
    Button
  } = window.DazitDesignSystem_c0d281;
  const {
    WORKSHEETS,
    LEVELS,
    LEVEL_TONE,
    tone
  } = window;
  const levelCounts = {
    'A1.1': 240,
    'A1.2': 198,
    'A2.1': 231,
    'A2.2': 176,
    'B1.1': 154,
    'B1.2': 109
  };
  return /*#__PURE__*/React.createElement("main", {
    style: {
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement("section", {
    style: {
      position: 'relative',
      minHeight: 640,
      overflow: 'hidden',
      background: 'var(--hero-blue)',
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: 'absolute',
      zIndex: 5,
      top: 150,
      right: -158,
      width: 700,
      padding: '12px 0',
      transform: 'rotate(45deg)',
      background: 'var(--accent)',
      color: '#fff',
      textAlign: 'center',
      fontSize: 20,
      fontWeight: 800,
      textTransform: 'uppercase',
      boxShadow: 'var(--shadow-ribbon)'
    }
  }, "Public Beta"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      zIndex: 2,
      width: 'min(58%,940px)',
      maxWidth: 1540,
      margin: '0 max(46px,calc((100vw - 1540px) / 2))',
      padding: '76px 0 170px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'inline-block',
      width: 'fit-content',
      marginBottom: 18,
      padding: '8px 14px',
      border: '1px solid rgb(255 255 255 / 38%)',
      borderRadius: 999,
      background: 'rgb(255 255 255 / 12%)',
      fontSize: 14,
      fontWeight: 700
    }
  }, "Suchen \xB7 Downloaden \xB7 Nutzen"), /*#__PURE__*/React.createElement("h1", {
    style: {
      maxWidth: 900,
      margin: 0,
      fontSize: 'clamp(38px,4vw,58px)',
      fontWeight: 500,
      lineHeight: 1.08,
      letterSpacing: '-.035em'
    }
  }, /*#__PURE__*/React.createElement(CountUp, {
    value: 1108
  }), " Arbeits- und Merkbl\xE4tter,", /*#__PURE__*/React.createElement("br", null), "Spiele und Kartensets f\xFCr", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("em", {
    style: {
      fontStyle: 'normal'
    }
  }, "DaZ-Kurse"), " mit Erwachsenen"), /*#__PURE__*/React.createElement("form", {
    onSubmit: e => {
      e.preventDefault();
      onNav('library');
    },
    style: {
      display: 'flex',
      maxWidth: 820,
      gap: 12,
      marginTop: 34
    }
  }, /*#__PURE__*/React.createElement("input", {
    placeholder: "Bibliothek durchsuchen",
    style: {
      minWidth: 0,
      height: 54,
      flex: 1,
      border: '1px solid #aeb0ba',
      borderRadius: 6,
      background: '#fff',
      padding: '0 16px',
      outline: 'none',
      color: 'var(--navy)'
    }
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      minWidth: 112,
      border: 0,
      borderRadius: 6,
      background: 'var(--accent)',
      color: '#fff',
      fontSize: 18,
      fontWeight: 700,
      cursor: 'pointer'
    },
    type: "submit"
  }, "Suchen"))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      zIndex: 3,
      right: 46,
      bottom: 0,
      left: 46,
      display: 'grid',
      overflow: 'hidden',
      gridTemplateColumns: 'repeat(6,1fr)',
      borderRadius: '9px 9px 0 0'
    }
  }, LEVELS.map(level => /*#__PURE__*/React.createElement("a", {
    href: "#",
    key: level,
    onClick: e => {
      e.preventDefault();
      onNav('library', {
        level
      });
    },
    style: {
      minHeight: 116,
      padding: '26px 24px',
      background: `var(--tint-${LEVEL_TONE[level]}-bg)`,
      color: `var(--tint-${LEVEL_TONE[level]}-ink)`
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      display: 'block',
      fontSize: 27
    }
  }, level), /*#__PURE__*/React.createElement("small", {
    style: {
      display: 'block',
      marginTop: 8,
      opacity: .72,
      fontSize: 14
    }
  }, levelCounts[level], " Dokumente"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1540,
      margin: '0 auto',
      padding: '42px 46px 80px'
    }
  }, /*#__PURE__*/React.createElement("section", {
    style: {
      marginTop: 42
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 18,
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontSize: 25,
      color: 'var(--navy)'
    }
  }, "Diese Woche neu"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    onClick: () => onNav('library'),
    style: {
      marginLeft: 'auto',
      padding: 0,
      height: 'auto'
    }
  }, "Alle neuen Dokumente \u203A")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4,minmax(0,1fr))',
      gap: 22
    }
  }, WORKSHEETS.slice(0, 4).map(w => /*#__PURE__*/React.createElement("div", {
    key: w.slug,
    onClick: () => onOpenWorksheet(w),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(WorksheetCard, {
    canDownload: false,
    description: w.description,
    documentType: w.documentType,
    downloads: w.downloads,
    hasAnswerKey: w.hasAnswerKey,
    pages: w.pages,
    title: w.title,
    tone: tone(w.level)
  })))))));
}
Object.assign(window, {
  HomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dazit-library/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dazit-library/LibraryScreen.jsx
try { (() => {
function FilterSidebar({
  selectedLevels,
  selectedTypes,
  onToggleLevel,
  onToggleType,
  typeCounts
}) {
  const {
    Checkbox,
    Switch
  } = window.DazitDesignSystem_c0d281;
  const {
    LEVELS,
    TYPES
  } = window;
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      paddingRight: 22,
      borderRight: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      padding: '0 0 16px',
      borderBottom: '1px solid var(--line)',
      fontSize: 16,
      color: 'var(--navy)'
    }
  }, "Filter"), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 0',
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 6px',
      color: '#858794',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '.07em',
      textTransform: 'uppercase'
    }
  }, "Niveau"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2,1fr)',
      columnGap: 14
    }
  }, LEVELS.map(l => /*#__PURE__*/React.createElement(Checkbox, {
    checked: selectedLevels.includes(l),
    key: l,
    onChange: c => onToggleLevel(l, c)
  }, l)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '14px 0',
      borderBottom: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 6px',
      color: '#858794',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '.07em',
      textTransform: 'uppercase'
    }
  }, "Typ"), TYPES.map(t => /*#__PURE__*/React.createElement(Checkbox, {
    checked: selectedTypes.includes(t),
    count: typeCounts[t] || 0,
    key: t,
    onChange: c => onToggleType(t, c)
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '18px 0'
    }
  }, /*#__PURE__*/React.createElement(Switch, null, "Mit L\xF6sungsblatt")), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingTop: 18
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: '0 0 10px',
      color: '#858794',
      fontSize: 11,
      fontWeight: 800,
      letterSpacing: '.07em',
      textTransform: 'uppercase'
    }
  }, "Beliebte Tags"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 7
    }
  }, ['vocabulary', 'game', 'reading', 'grammar', 'numbers'].map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    style: {
      whiteSpace: 'nowrap',
      border: '1px solid #c6c7ce',
      borderRadius: 999,
      background: '#fff',
      padding: '4px 10px',
      fontSize: 11,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, t)))));
}
function LibraryScreen({
  initialLevel,
  onOpenWorksheet
}) {
  const {
    WorksheetCard,
    Select,
    Pagination,
    Input
  } = window.DazitDesignSystem_c0d281;
  const {
    WORKSHEETS,
    tone
  } = window;
  const [levels, setLevels] = React.useState(initialLevel ? [initialLevel] : []);
  const [types, setTypes] = React.useState([]);
  const [sort, setSort] = React.useState('newest');
  const [page, setPage] = React.useState(1);
  const topics = ['Zahlen', 'Uhrzeiten', 'Trennbare Verben', 'weil-Satz', 'dass-Satz', 'Relativsatz', 'Adjektivdeklination'];
  const typeCounts = WORKSHEETS.reduce((acc, w) => ({
    ...acc,
    [w.documentType]: (acc[w.documentType] || 0) + 1
  }), {});
  const filtered = WORKSHEETS.filter(w => (!levels.length || levels.includes(w.level)) && (!types.length || types.includes(w.documentType)));
  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const shown = filtered.slice((page - 1) * pageSize, page * pageSize);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      minHeight: 62,
      alignItems: 'center',
      gap: 12,
      padding: '12px 46px',
      overflowX: 'auto',
      borderBottom: '1px solid var(--line)'
    }
  }, topics.map(t => /*#__PURE__*/React.createElement("button", {
    key: t,
    style: {
      whiteSpace: 'nowrap',
      border: '1px solid #c6c7ce',
      borderRadius: 999,
      background: '#fff',
      padding: '7px 15px',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer'
    }
  }, t))), /*#__PURE__*/React.createElement("main", {
    style: {
      display: 'grid',
      maxWidth: 1540,
      gridTemplateColumns: '270px minmax(0,1fr)',
      gap: 36,
      margin: '0 auto',
      padding: '22px 32px 72px',
      fontFamily: 'var(--font-sans)'
    }
  }, /*#__PURE__*/React.createElement(FilterSidebar, {
    onToggleLevel: (l, c) => {
      setPage(1);
      setLevels(cur => c ? [...cur, l] : cur.filter(x => x !== l));
    },
    onToggleType: (t, c) => {
      setPage(1);
      setTypes(cur => c ? [...cur, t] : cur.filter(x => x !== t));
    },
    selectedLevels: levels,
    selectedTypes: types,
    typeCounts: typeCounts
  }), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    icon: "search",
    placeholder: "Titel oder Stichwort suchen \u2026"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      fontSize: 17,
      color: 'var(--navy)'
    }
  }, filtered.length, " Ergebnisse"), /*#__PURE__*/React.createElement(Select, {
    ariaLabel: "Sortierung",
    onChange: setSort,
    options: [{
      value: 'newest',
      label: 'Neueste zuerst'
    }, {
      value: 'popular',
      label: 'Beliebteste zuerst'
    }, {
      value: 'title',
      label: 'Titel A–Z'
    }],
    value: sort
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3,minmax(0,1fr))',
      gap: 24
    }
  }, shown.map(w => /*#__PURE__*/React.createElement("div", {
    key: w.slug,
    onClick: () => onOpenWorksheet(w),
    style: {
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(WorksheetCard, {
    canDownload: false,
    description: w.description,
    documentType: w.documentType,
    downloads: w.downloads,
    hasAnswerKey: w.hasAnswerKey,
    pages: w.pages,
    title: w.title,
    tone: tone(w.level)
  })))), pageCount > 1 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Pagination, {
    onChange: setPage,
    page: page,
    pageCount: pageCount
  })))));
}
Object.assign(window, {
  LibraryScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dazit-library/LibraryScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dazit-library/data.js
try { (() => {
const LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];
const LEVEL_TONE = {
  'A1.1': 'blue-light',
  'A1.2': 'blue',
  'A2.1': 'green-light',
  'A2.2': 'green',
  'B1.1': 'orange-light',
  'B1.2': 'orange'
};
const TYPES = ['Arbeitsblatt', 'Merkblatt', 'Verbtabelle', 'Deklinationstabelle', 'Lernkarten', 'Domino', 'Dialog', 'Leseverstehen'];
const WORKSHEETS = [{
  slug: 'trennbare-verben-1',
  title: 'Trennbare Verben — Arbeitsblatt',
  documentType: 'Arbeitsblatt',
  level: 'A1.2',
  description: 'Übungen zu trennbaren Verben im Alltag: aufstehen, einkaufen, fernsehen.',
  pages: 4,
  downloads: 812,
  hasAnswerKey: true,
  tags: ['grammar', 'verbs']
}, {
  slug: 'verbtabelle-praesens',
  title: 'Verbtabelle Präsens A1.1',
  documentType: 'Verbtabelle',
  level: 'A1.1',
  description: 'Konjugationen regelmässiger und unregelmässiger Verben im Präsens.',
  pages: 2,
  downloads: 1204,
  hasAnswerKey: false,
  tags: ['grammar', 'reference']
}, {
  slug: 'weil-satz',
  title: 'weil-Satz — Merkblatt',
  documentType: 'Merkblatt',
  level: 'A2.1',
  description: 'Nebensätze mit weil bilden: Regeln, Signalwörter, Beispiele.',
  pages: 1,
  downloads: 645,
  hasAnswerKey: false,
  tags: ['grammar']
}, {
  slug: 'zahlen-lernkarten',
  title: 'Zahlen 1–100 — Lernkarten',
  documentType: 'Lernkarten',
  level: 'A1.1',
  description: 'Zum Ausschneiden und beidseitigen Drucken, für Zahlenspiele im Kurs.',
  pages: 6,
  downloads: 998,
  hasAnswerKey: false,
  tags: ['vocabulary', 'game', 'numbers']
}, {
  slug: 'beim-arzt-dialog',
  title: 'Beim Arzt — Dialog',
  documentType: 'Dialog',
  level: 'A2.2',
  description: 'Ein Gespräch zum Hören, Lesen und Nachspielen in Rollenpaaren.',
  pages: 3,
  downloads: 421,
  hasAnswerKey: true,
  tags: ['reading', 'speaking']
}, {
  slug: 'adjektivdeklination',
  title: 'Adjektivdeklination — Deklinationstabelle',
  documentType: 'Deklinationstabelle',
  level: 'B1.1',
  description: 'Endungen nach bestimmtem, unbestimmtem und ohne Artikel im Überblick.',
  pages: 2,
  downloads: 733,
  hasAnswerKey: false,
  tags: ['grammar']
}, {
  slug: 'wohnungssuche-lesen',
  title: 'Wohnungssuche — Leseverstehen',
  documentType: 'Leseverstehen',
  level: 'B1.2',
  description: 'Ein Inserat lesen und Verständnisfragen dazu beantworten.',
  pages: 3,
  downloads: 356,
  hasAnswerKey: true,
  tags: ['reading']
}, {
  slug: 'praepositionen-domino',
  title: 'Präpositionen — Domino',
  documentType: 'Domino',
  level: 'A2.1',
  description: 'Lokale Präpositionen spielerisch üben, in Gruppen von 2–4.',
  pages: 2,
  downloads: 289,
  hasAnswerKey: false,
  tags: ['game', 'grammar']
}, {
  slug: 'perfekt-arbeitsblatt',
  title: 'Perfekt mit haben und sein',
  documentType: 'Arbeitsblatt',
  level: 'A2.2',
  description: 'Lückentext und Umformungsübungen zum Perfekt.',
  pages: 3,
  downloads: 567,
  hasAnswerKey: true,
  tags: ['grammar', 'verbs']
}, {
  slug: 'uhrzeiten-merkblatt',
  title: 'Uhrzeiten — Merkblatt',
  documentType: 'Merkblatt',
  level: 'A1.1',
  description: 'Offizielle und umgangssprachliche Uhrzeitangaben gegenübergestellt.',
  pages: 1,
  downloads: 890,
  hasAnswerKey: false,
  tags: ['vocabulary']
}, {
  slug: 'dass-satz',
  title: 'dass-Satz — Merkblatt',
  documentType: 'Merkblatt',
  level: 'B1.1',
  description: 'dass-Sätze erkennen und korrekt bilden, mit Übersicht der Auslöser-Verben.',
  pages: 2,
  downloads: 412,
  hasAnswerKey: false,
  tags: ['grammar']
}, {
  slug: 'einkaufen-dialog',
  title: 'Einkaufen im Supermarkt — Dialog',
  documentType: 'Dialog',
  level: 'A1.2',
  description: 'Kurze Gespräche an der Kasse und im Gemüseladen.',
  pages: 2,
  downloads: 674,
  hasAnswerKey: true,
  tags: ['speaking', 'vocabulary']
}];
function tone(level) {
  return LEVEL_TONE[level] || 'lavender';
}
Object.assign(window, {
  LEVELS,
  LEVEL_TONE,
  TYPES,
  WORKSHEETS,
  tone
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dazit-library/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.WorksheetCard = __ds_scope.WorksheetCard;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.Pagination = __ds_scope.Pagination;

})();
