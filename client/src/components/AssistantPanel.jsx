import React, { useState } from 'react';
import { Bot, Send, Ticket, ArrowLeft, MessageSquare } from 'lucide-react';

const AssistantPanel = ({
  t,
  messages = [],
  onSubmitMessage,
  onCreateTicket,
}) => {
  const [inputText, setInputText] = useState('');
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');

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
    <div className="assistant-panel-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#f1f5f9' }}>
      <div className="assistant-panel-header" style={{ padding: '8px 12px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showTicketForm ? <Ticket size={18} /> : <Bot size={18} />}
          <span style={{ fontWeight: 600 }}>{showTicketForm ? t('Create Ticket') : t('Assistant')}</span>
        </div>
        <button
          type="button"
          onClick={handleToggleTicket}
          className="toggle-ticket-btn"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px', border: '1px solid #475569', borderRadius: '4px', background: 'transparent', color: '#cbd5e1', cursor: 'pointer' }}
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
        <form onSubmit={handleSubmitTicket} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, backgroundColor: '#0f172a' }}>
          <div>
            <label htmlFor="ticket-title" style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{t('Title')}</label>
            <input
              id="ticket-title"
              type="text"
              placeholder={t('e.g. Overlapping right panel')}
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff' }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label htmlFor="ticket-desc" style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>{t('Description')}</label>
            <textarea
              id="ticket-desc"
              placeholder={t('Describe the issue...')}
              value={ticketDesc}
              onChange={(e) => setTicketDesc(e.target.value)}
              required
              style={{ width: '100%', flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#1e293b', color: '#fff', resize: 'none', fontFamily: 'monospace', fontSize: '12px' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: '#0f172a', overflow: 'hidden' }}>
          <div className="message-history" style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b', textAlign: 'center', padding: '24px' }}>
                <MessageSquare size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '13px' }}>{t('Ask me questions about medical terms, active task guidelines, or logging developer tickets.')}</p>
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    maxWidth: '85%',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    backgroundColor: msg.sender === 'user' ? '#2563eb' : '#1e293b',
                    color: msg.sender === 'user' ? '#fff' : '#e2e8f0',
                    border: msg.sender === 'user' ? 'none' : '1px solid #334155',
                  }}
                >
                  {msg.text}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSend} style={{ padding: '12px', borderTop: '1px solid #334155', display: 'flex', gap: '8px', backgroundColor: '#1e293b' }}>
            <input
              type="text"
              placeholder={t('Type your message...')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #475569', backgroundColor: '#0f172a', color: '#fff', fontSize: '13px' }}
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
