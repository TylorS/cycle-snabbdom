import Rx from 'rx'

function isElement(obj) {
  return typeof HTMLElement === `object` ?
    obj instanceof HTMLElement || obj instanceof DocumentFragment : //DOM2
    obj && typeof obj === `object` && obj !== null &&
    (obj.nodeType === 1 || obj.nodeType === 11) &&
    typeof obj.nodeName === `string`
}

function getDomElement(_el) {
  const domElement =
    typeof _el === `string`?
      document.querySelector(_el) : _el;

  if (typeof domElement === `string` && domElement === null) {
    throw new Error(`Cannot render into unknown element \`${container}\``)
  } else if (!isElement(domElement)) {
    throw new Error(`Given container is not a DOM element neither a selector ` +
      `string.`)
  }
  return domElement;
}

export {getDomElement}
