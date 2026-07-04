import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, Ticket, ArrowLeft, MessageSquare } from 'lucide-react';

const parseInlineMarkdown = (text) => {
  let parts = [{ type: 'text', content: text }];

  // Bold replacement
  parts = parts.flatMap((part) => {
    if (part.type !== 'text') return part;
    const subParts = [];
    let remaining = part.content;
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    let lastIndex = 0;
    while ((match = boldRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        subParts.push({ type: 'text', content: remaining.slice(lastIndex, match.index) });
      }
      subParts.push({ type: 'bold', content: match[1] });
      lastIndex = boldRegex.lastIndex;
    }
    if (lastIndex < remaining.length) {
      subParts.push({ type: 'text', content: remaining.slice(lastIndex) });
    }
    return subParts;
  });

  // Code replacement
  parts = parts.flatMap((part) => {
    if (part.type !== 'text') return part;
    const subParts = [];
    let remaining = part.content;
    const codeRegex = /`(.*?)`/g;
    let match;
    let lastIndex = 0;
    while ((match = codeRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        subParts.push({ type: 'text', content: remaining.slice(lastIndex, match.index) });
      }
      subParts.push({ type: 'code', content: match[1] });
      lastIndex = codeRegex.lastIndex;
    }
    if (lastIndex < remaining.length) {
      subParts.push({ type: 'text', content: remaining.slice(lastIndex) });
    }
    return subParts;
  });

  // Italic replacement
  parts = parts.flatMap((part) => {
    if (part.type !== 'text') return part;
    const subParts = [];
    let remaining = part.content;
    const italicRegex = /\*(.*?)\*/g;
    let match;
    let lastIndex = 0;
    while ((match = italicRegex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        subParts.push({ type: 'text', content: remaining.slice(lastIndex, match.index) });
      }
      subParts.push({ type: 'italic', content: match[1] });
      lastIndex = italicRegex.lastIndex;
    }
    if (lastIndex < remaining.length) {
      subParts.push({ type: 'text', content: remaining.slice(lastIndex) });
    }
    return subParts;
  });

  return parts.map((part, index) => {
    if (part.type === 'bold') {
      return <strong key={index}>{part.content}</strong>;
    }
    if (part.type === 'code') {
      return (
        <code
          key={index}
          style={{
            backgroundColor: '#e2e8f0',
            color: '#0f172a',
            padding: '2px 4px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
        >
          {part.content}
        </code>
      );
    }
    if (part.type === 'italic') {
      return <em key={index}>{part.content}</em>;
    }
    return part.content;
  });
};

const parseMarkdown = (text) => {
  if (!text) return '';
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Check for headers
    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      const content = parseInlineMarkdown(headerMatch[2]);
      const Tag = `h${level}`;
      const sizeStyle = level === 1 ? '16px' : level === 2 ? '15px' : '14px';
      return (
        <Tag key={idx} style={{ margin: '8px 0 4px 0', fontWeight: 'bold', fontSize: sizeStyle }}>
          {content}
        </Tag>
      );
    }

    // Check for bullet list
    const listMatch = line.match(/^[-*]\s+(.*)$/);
    if (listMatch) {
      const content = parseInlineMarkdown(listMatch[1]);
      return (
        <ul key={idx} style={{ margin: '4px 0', paddingLeft: '16px', listStyleType: 'disc' }}>
          <li>{content}</li>
        </ul>
      );
    }

    // Default paragraph
    if (line.trim() === '') {
      return <div key={idx} style={{ height: '8px' }} />;
    }

    return (
      <p key={idx} style={{ margin: '4px 0' }}>
        {parseInlineMarkdown(line)}
      </p>
    );
  });
};

const AssistantPanel = ({
  t,
  messages = [],
  isTyping = false,
  onSubmitMessage,
  onCreateTicket,
}) => {
  const [inputText, setInputText] = useState('');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current && typeof messagesEndRef.current.scrollIntoView === 'function') {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showTicketForm, isTyping]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSubmitMessage(inputText.trim());
    setInputText('');
  };

  const handleToggleTicket = () => {
    if (!showTicketForm) {
      // Prepopulate description with chat context
      const chatSummary = messages
        .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
        .join('\n');
      setTicketDesc(chatSummary);
    }
    setShowTicketForm(!showTicketForm);
  };

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!ticketTitle.trim() || !ticketDesc.trim()) return;
    onCreateTicket({
      title: ticketTitle.trim(),
      description: ticketDesc.trim(),
    });
    setTicketTitle('');
    setTicketDesc('');
    setShowTicketForm(false);
  };

  return (
    <div className="assistant-panel-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#1e293b' }}>
      <div className="assistant-panel-header" style={{ padding: '8px 12px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showTicketForm ? <Ticket size={18} /> : <Bot size={18} />}
          <span style={{ fontWeight: 600 }}>{showTicketForm ? t('Create Ticket') : t('Assistant')}</span>
        </div>
        <button
          type="button"
          onClick={handleToggleTicket}
          className="toggle-ticket-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'transparent', color: '#475569', cursor: 'pointer' }}
        >
          {showTicketForm ? (
            <>
              <ArrowLeft size={14} />
              {t('Back to Chat')}
            </>
          ) : (
            <>
              <Ticket size={14} />
              {t('Log Dev Ticket')}
            </>
          )}
        </button>
      </div>

      {showTicketForm ? (
        <form onSubmit={handleSubmitTicket} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, backgroundColor: 'transparent' }}>
          <div>
            <label htmlFor="ticket-title" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('Title')}</label>
            <input
              id="ticket-title"
              type="text"
              placeholder={t('e.g. Overlapping right panel')}
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#0f172a' }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="ticket-desc" style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>{t('Description')}</label>
            <textarea
              id="ticket-desc"
              placeholder={t('Describe the issue...')}
              value={ticketDesc}
              onChange={(e) => setTicketDesc(e.target.value)}
              required
              style={{ width: '100%', flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#0f172a', resize: 'none', fontFamily: 'monospace', fontSize: '12px' }}
            />
          </div>

          <button
            type="submit"
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
          >
            {t('Submit Ticket')}
          </button>
        </form>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'transparent', overflow: 'hidden' }}>
          <div className="message-history" style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', textAlign: 'center', padding: '24px' }}>
                <MessageSquare size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '13px' }}>{t('Ask me questions about medical terms, active task guidelines, or logging developer tickets.')}</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const hasTicketAction = msg.sender === 'ai' && msg.text.includes('[action:create_ticket]');
                const cleanText = msg.text.replace('[action:create_ticket]', '').trim();
                return (
                  <div
                    key={index}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      maxWidth: '85%',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      backgroundColor: msg.sender === 'user' ? '#2563eb' : '#f1f5f9',
                      color: msg.sender === 'user' ? '#fff' : '#0f172a',
                      border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                    }}
                  >
                    <div>{parseMarkdown(cleanText)}</div>
                    {hasTicketAction && (
                      <button
                        type="button"
                        onClick={handleToggleTicket}
                        className="message-ticket-action-btn"
                        style={{
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: '#e11d48',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '12px',
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <Ticket size={14} />
                        {t('Create Developer Ticket')}
                      </button>
                    )}
                  </div>
                );
              })
            )}
            {isTyping && (
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  maxWidth: '85%',
                  fontSize: '13px',
                  alignSelf: 'flex-start',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid #cbd5e1', display: 'flex', gap: '8px', backgroundColor: '#f8fafc' }}>
            <input
              type="text"
              placeholder={t('Type your message...')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#fff', color: '#0f172a', fontSize: '13px' }}
            />
            <button
              type="submit"
              aria-label="Send"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '4px', border: 'none', backgroundColor: '#2563eb', color: '#fff', cursor: 'pointer' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AssistantPanel;
