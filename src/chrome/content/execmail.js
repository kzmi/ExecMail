/*
 * ExecMail
 *
 * Copyright(c) 2007-2010 Iwasa Kazmi
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

var gExecMail_0B2B5EAB = {

    MailObject: function()
        {
            this.subject = null;
            this.body = null;
            this.to = new Array();
            this.cc = new Array();
            this.bcc = new Array();
            this.appendSignature = false;
        },

    insertSample: function()
        {
            var editor = GetCurrentEditor();

            if (editor) {
                var sampleArray = this.getSampleCodeArray();

                if (editor.contentsMIMEType == 'text/plain') {
                    var text = this.joinForPlainText(sampleArray);
                    editor.insertText(text);
                }
                else if (editor.contentsMIMEType == 'text/html') {
                    var text = this.joinForHtml(sampleArray);
                    editor.insertHTML(text);
                }
                else {
                    dump('#ExecMail# unsupported content type : ' + editor.contentsMIMEType);
                }
            }
        },

    execMail: function()
        {
            var text = this.getCurrentContentText();
            if (text) {
                var mail = new this.MailObject();

                try {
                    eval(text);
                } catch(e) {
                    dump('#ExecMail# JavaScript eval error: ' + e);
                    alert('JavaScript eval error: ' + e);
                    return;
                }

                if (mail.subject) {
                    this.replaceSubject(mail.subject);
                }

                if (mail.body) {
                    this.replaceBody(mail.body);
                } else {
                    this.replaceBody(null);
                }

                if (mail.appendSignature) {
                    this.appendSignature();
                }

                if (mail.to) {
                    this.appendAddresses("addr_to", mail.to);
                }

                if (mail.cc) {
                    this.appendAddresses("addr_cc", mail.cc);
                }

                if (mail.bcc) {
                    this.appendAddresses("addr_bcc", mail.bcc);
                }
            }
        },

    getCurrentContentText: function()
        {
            var editor = GetCurrentEditor();
            if (editor) {
                return editor.outputToString('text/plain', 0);
            } else {
                return null;
            }
        },

    replaceSubject: function(newSubject)
        {
            var e = GetMsgSubjectElement();
            if (e) {
                e.value = newSubject.toString();
            }
        },

    replaceBody: function(newBody)
        {
            var editor = GetCurrentEditor();

            if (editor) {
                editor.selectAll();
                editor.deleteSelection(0);
                editor.beginningOfDocument();

                if (newBody == null)
                    return;

                if (editor.contentsMIMEType == 'text/plain') {
                    editor.insertText(newBody.toString());
                }
                else if (editor.contentsMIMEType == 'text/html') {
                    editor.insertHTML(newBody.toString());
                }
                else {
                    dump('#ExecMail# unsupported content type : ' + editor.contentsMIMEType);
                }
            }
        },

    appendSignature: function()
        {
            // from MsgComposeCommands.js, LoadIdentity()
            try {
                gMsgCompose.SetSignature(gCurrentIdentity);
            } catch(ex) {
                dump("### Cannot set the signature: " + ex + "\n");
            }
        },

    appendAddresses: function(addrType, obj)
        {
            var addrArray;
            if (obj instanceof Array) {
                addrArray = obj;
            } else {
                addrArray = new Array(obj);
            }

            for (var i = 0; i < addrArray.length; i++) {
                if (addrArray[i]) {
                    awAddRecipient(addrType, addrArray[i].toString());
                }
            }
        },

    htmlEscape: function(s)
        {
            s = s.replace(/&/g, "&amp;");
            s = s.replace(/>/g, "&gt;");
            s = s.replace(/</g, "&lt;");
            s = s.replace(/^ /, "&nbsp;");
            return s;
        },

    joinForHtml: function(a)
        {
            var text = '';
            for(var i = 0; i < a.length; i++) {
                if (i != 0)
                text += '<br/>';
                text += this.htmlEscape(a[i].toString());
            }
            return text;
        },

    joinForPlainText: function(a)
        {
            return a.join("\r\n");
        },

    getSampleCodeArray: function()
        {
            var strbundle = document.getElementById("execmailBundle");

            return [
                '/*',
                ' * ' + strbundle.getString("ExecMailSample"),
                ' */',
                '',
                'var mailHost = \'@example.com\';',
                'var myAddress = \'abc@example.com\';',
                '',
                '/* ' + strbundle.getString("MailObjectDesc") + ' */',
                '',
                '/* ' + strbundle.getString("SpecifySubject") + ' */',
                'mail.subject = \'Notification\';',
                '',
                '/* ' + strbundle.getString("SpecifyMessageBody") + ' */',
                'mail.body = \'Hello,\\r\\nbye.\';',
                '/* ' + strbundle.getString("HtmlTagsAreAllowed") + ' */',
                '// mail.body = \'<font size="20">Hello,</font><br><b>bye.</b>\';',
                '',
                '/* ' + strbundle.getString("AddToRecipients") + ' */',
                'mail.to.push(\'person1\' + mailHost);',
                'mail.to.push(\'person2\' + mailHost);',
                'mail.to.push(\'person3\' + mailHost);',
                '/* ' + strbundle.getString("AddSingleRecipient") + ' */',
                '// mail.to = \'person1@example.com\';',
                '',
                '/* ' + strbundle.getString("AddCCRecipients") + ' */',
                'mail.cc.push(\'person4\' + mailHost);',
                '',
                '/* ' + strbundle.getString("AddBCCRecipients") + ' */',
                'mail.bcc.push(myAddress);',
                '',
                '/* ' + strbundle.getString("AppendSignature") + ' */',
                'mail.appendSignature = true;',
                '',
            ];
        }

};
