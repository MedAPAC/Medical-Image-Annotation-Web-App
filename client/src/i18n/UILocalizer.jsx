import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { isRtlLanguage, translateUIText } from "./uiText";

let browserDialogsPatched = false;
let activeLanguage = "en";

const localizableAttributes = ["placeholder", "title", "aria-label", "alt"];
const skippedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"]);

const shouldSkipElement = (element) => {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
  if (skippedTags.has(element.tagName)) return true;
  return Boolean(element.closest("[data-i18n-skip='true']"));
};

const translateTextNode = (node, language) => {
  const current = node.nodeValue || "";
  if (!current.trim()) return;

  const previousTranslated = node.__localizedText;
  const previousSource = node.__sourceText;
  const source = previousSource && current === previousTranslated ? previousSource : current;
  const translated = translateUIText(source, language);

  node.__sourceText = source;
  node.__localizedText = translated;

  if (translated !== current) {
    node.nodeValue = translated;
  }
};

const translateAttribute = (element, attribute, language) => {
  if (!element.hasAttribute(attribute)) return;

  const current = element.getAttribute(attribute) || "";
  if (!current.trim()) return;

  const sourceKey = `__source_${attribute}`;
  const translatedKey = `__localized_${attribute}`;
  const source = element[sourceKey] && current === element[translatedKey]
    ? element[sourceKey]
    : current;
  const translated = translateUIText(source, language);

  element[sourceKey] = source;
  element[translatedKey] = translated;

  if (translated !== current) {
    element.setAttribute(attribute, translated);
  }
};

const translateElementAttributes = (element, language) => {
  if (shouldSkipElement(element)) return;
  localizableAttributes.forEach((attribute) => translateAttribute(element, attribute, language));
};

const translateTree = (root, language) => {
  if (!root) return;

  if (root.nodeType === Node.TEXT_NODE) {
    if (!shouldSkipElement(root.parentElement)) {
      translateTextNode(root, language);
    }
    return;
  }

  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;

  if (root.nodeType === Node.ELEMENT_NODE) {
    translateElementAttributes(root, language);
  }

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
    {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          return shouldSkipElement(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        }
        if (node.nodeType === Node.TEXT_NODE && shouldSkipElement(node.parentElement)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      translateTextNode(node, language);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      translateElementAttributes(node, language);
    }
    node = walker.nextNode();
  }
};

const patchBrowserDialogs = () => {
  if (browserDialogsPatched || typeof window === "undefined") return;

  const nativeAlert = window.alert.bind(window);
  const nativeConfirm = window.confirm.bind(window);
  const nativePrompt = window.prompt.bind(window);

  window.alert = (message) => nativeAlert(translateUIText(message, activeLanguage));
  window.confirm = (message) => nativeConfirm(translateUIText(message, activeLanguage));
  window.prompt = (message, defaultValue) => nativePrompt(
    translateUIText(message, activeLanguage),
    defaultValue
  );

  browserDialogsPatched = true;
};

function UILocalizer() {
  const { i18n, ready } = useTranslation("ui");
  const frameRef = useRef(null);

  useEffect(() => {
    patchBrowserDialogs();
  }, []);

  useEffect(() => {
    activeLanguage = i18n.language || "en";
    const language = activeLanguage.split("-")[0];

    document.documentElement.lang = language;
    document.documentElement.dir = isRtlLanguage(language) ? "rtl" : "ltr";
    document.body?.setAttribute("data-language", language);

    const scheduleTranslate = () => {
      if (frameRef.current) return;
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        translateTree(document.body, language);
      });
    };

    scheduleTranslate();

    const observer = new MutationObserver((mutations) => {
      let shouldTranslate = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          shouldTranslate = true;
        }

        if (mutation.type === "childList" && (mutation.addedNodes.length || mutation.removedNodes.length)) {
          shouldTranslate = true;
        }

        if (mutation.type === "attributes" && localizableAttributes.includes(mutation.attributeName)) {
          shouldTranslate = true;
        }
      });

      if (shouldTranslate) scheduleTranslate();
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: localizableAttributes,
      });
    }

    return () => {
      observer.disconnect();
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [i18n.language, ready]);

  return null;
}

export default UILocalizer;
