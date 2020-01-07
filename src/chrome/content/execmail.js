/*
 * ExecMail
 *
 * Copyright(c) 2007-2020 Iwasa Kazmi
 * All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
((window) => {
  const debug = false;

  const { Services } = ChromeUtils.import('resource://gre/modules/Services.jsm');

  const OutputLFLineBreak = Components.interfaces.nsIDocumentEncoder.OutputLFLineBreak;

  function log(message) {
    Services.console.logStringMessage(message);
  }

  function debugLog(message) {
    if (debug) {
      Services.console.logStringMessage(message);
    }
  }

  function reportError(err) {
    Components.utils.reportError(err);
  }

  // returns current nsMsgCompose
  function getMsgCompose() {
    // use gMsgCompose which is defined globally in
    // chrome/messenger/content/messenger/messengercompose/MsgComposeCommands.js
    return window.gMsgCompose;
  }

  class MailObject {
    constructor() {
      this.subject = null;
      this.body = null;
      this.to = new Array();
      this.cc = new Array();
      this.bcc = new Array();
      this.appendSignature = false;
    }
  }

  function getSampleCode() {
    const strbundle = window.document.getElementById('execmailBundle');
    const sampleCode =
      '/*\n' +
      ` * ${strbundle.getString('ExecMailSample')}\n` +
      ' */\n' +
      '\n' +
      'var mailHost = "@example.com";\n' +
      'var myAddress = "abc@example.com";\n' +
      '\n' +
      `// ${strbundle.getString('MailObjectDesc')}\n` +
      '// {\n' +
      '//   subject: null,\n' +
      '//   body: null,\n' +
      '//   to: [],\n' +
      '//   cc: [],\n' +
      '//   bcc: [],\n' +
      '//   appendSignature: false\n' +
      '// }\n' +
      '\n' +
      `// ${strbundle.getString('SpecifySubject')}\n` +
      'mail.subject = "Notification";\n' +
      '\n' +
      `// ${strbundle.getString('SpecifyMessageBody')}\n` +
      'mail.body = "Hello,\\r\\n\\r\\nbye";\n' +
      '\n' +
      `// ${strbundle.getString('HtmlTagsAreAllowed')}\n` +
      '// mail.body = \'<font size="20">Hello,</font><br><br><b>bye</b>\';\n' +
      '\n' +
      `// ${strbundle.getString('AddToRecipients')}\n` +
      'mail.to.push("person1" + mailHost);\n' +
      'mail.to.push("person2" + mailHost);\n' +
      'mail.to.push("person3" + mailHost);\n' +
      '\n' +
      `// ${strbundle.getString('AddSingleRecipient')}\n` +
      'mail.to = "person1@example.com";\n' +
      '\n' +
      `// ${strbundle.getString('AddCCRecipients')}\n` +
      'mail.cc.push("person4" + mailHost);\n' +
      '\n' +
      `// ${strbundle.getString('AddBCCRecipients')}\n` +
      'mail.bcc.push(myAddress);\n' +
      '\n' +
      `// ${strbundle.getString('AppendSignature')}\n` +
      'mail.appendSignature = true;\n';

    return sampleCode;
  }

  function insertSample() {
    const editor = window.GetCurrentEditor();
    if (!editor) {
      log('ExecMail: missing editor');
      return;
    }

    const sampleCode = getSampleCode();

    debugLog(`editor.contentsMIMEType = ${editor.contentsMIMEType}`);
    editor.insertText(sampleCode);
  }

  function getScript(editor) {
    const source = editor.outputToString('text/plain', OutputLFLineBreak);

    // remove signature
    const sigIndex = source.indexOf('\n-- \n');
    if (sigIndex >= 0) {
      return source.substring(0, sigIndex);
    }

    if (source.startsWith('-- \n')) {
      return '';
    }

    return source;
  }

  function formatError(obj, lineNumberOffset) {
    if (obj.message == null) {
      return `${obj}`;
    }

    let message = '';
    if (obj.name != null) {
      message += `${obj.name} `;
    }
    if (obj.lineNumber != null && obj.columnNumber != null) {
      message += `${obj.lineNumber - lineNumberOffset + 1}:${obj.columnNumber + 1} `;
    }
    message += obj.message;
    return message;
  }

  function execMail() {
    const editor = window.GetCurrentEditor();
    if (!editor) {
      log('ExecMail: missing editor');
      return;
    }

    const script = getScript(editor);

    const mail = new MailObject();

    const sandbox = Components.utils.Sandbox(window);
    sandbox.mail = mail;

    // if error has occurred during Components.utils.evalInSandbox(),
    // Error object will be thrown, and its `lineNumber` property has the value of
    // (line number of `Components.utils.evalInSandbox()`) + (line number in the script).
    //
    // to get the line number in the script, we need to know the line number of
    // `Components.utils.evalInSandbox()`.
    let lineNumberOffset = 0;
    try {
      throw new Error('');
    } catch (ex) {
      lineNumberOffset = ex.lineNumber + 5; // add offset from 'throw new Error()' to 'Components.utils.evalInSandbox()'
    }
    try {
      Components.utils.evalInSandbox(script, sandbox);
    } catch (ex) {
      reportError(ex);
      Services.prompt.alert(window, "Execution Error", formatError(ex, lineNumberOffset));
      return;
    }

    if (mail.subject) {
      replaceSubject(mail.subject);
    }

    if (mail.body) {
      replaceBody(mail.body);
    } else {
      replaceBody('');
    }

    if (mail.appendSignature) {
      appendSignature();
    }

    if (mail.to) {
      appendAddresses('addr_to', mail.to);
    }

    if (mail.cc) {
      appendAddresses('addr_cc', mail.cc);
    }

    if (mail.bcc) {
      appendAddresses('addr_bcc', mail.bcc);
    }
  }

  function replaceSubject(newSubject) {
    const elem = window.GetMsgSubjectElement();
    if (!elem) {
      log('ExecMail: missing msgSubject');
      return;
    }

    elem.value = `${newSubject}`;
  }

  function replaceBody(newBody) {
    const editor = window.GetCurrentEditor();
    if (!editor) {
      log('ExecMail: missing editor');
      return;
    }

    debugLog(`editor.contentsMIMEType = ${editor.contentsMIMEType}`);

    editor.selectAll();
    editor.deleteSelection(editor.eNone, editor.eStrip);
    editor.beginningOfDocument();

    const msgCompose = getMsgCompose();
    if (msgCompose && msgCompose.composeHTML) {
      editor.insertHTML(`${newBody}`);
    } else {
      editor.insertText(`${newBody}`);
    }
  }

  function appendSignature() {
    const msgCompose = getMsgCompose();
    if (!msgCompose) {
      log('ExecMail: missing nsMsgCompose object');
      return;
    }
    const identity = msgCompose.identity;
    if (identity) {
      // calls nsMsgCompose::SetIdentity(nsIMsgIdentity*).
      // signature will be updated.
      msgCompose.identity = identity;
    }
  }

  function appendAddresses(addrType, obj) {
    const addrArray = (obj instanceof Array) ? obj : [obj];
    for (const addr of addrArray) {
      if (addr) {
        // use `awAddRecipient` which is defined in
        // chrome/messenger/content/messenger/messengercompose/addressingWidgetOverlay.js
        awAddRecipient(addrType, `${addr}`);
      }
    }
  }

  window.addEventListener('load', () => {
    debugLog('ExecMail: onload');
    window.document.getElementById('cmd_em_execute').addEventListener('command', execMail);
    window.document.getElementById('cmd_em_insertsample').addEventListener('command', insertSample);
  });

})(window);
