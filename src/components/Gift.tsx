import { useState } from 'react'
import { config } from '../config'
import { copyWithToast } from '../lib/ui'
import { Icon, Section } from './common'

function Accordion(props: { id: string; side: string; list: typeof config.accounts.groom }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="card accordion">
      <button
        type="button"
        className="accordion-head"
        aria-expanded={open}
        aria-controls={`${props.id}-panel`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="side-badge">{props.side}</span>
        <span className="strong">{props.side}측 계좌번호</span>
        <Icon name={open ? 'expand_less' : 'expand_more'} />
      </button>
      <div id={`${props.id}-panel`} className="accordion-panel" hidden={!open}>
        {props.list.map((a) => (
          <div key={a.role} className="account">
            <div>
              <p>
                <span className="primary tiny">{a.role}</span> <b>{a.name}</b>
              </p>
              <p className="body">
                {a.bank} <span className="mono">{a.number}</span>
              </p>
            </div>
            <button
              type="button"
              className="copy-btn"
              onClick={() => copyWithToast(`${a.bank} ${a.number}`, '계좌번호가 복사되었습니다')}
              aria-label={`${a.name} ${a.bank} 계좌번호 복사`}
            >
              <Icon name="content_copy" /> 복사
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Gift() {
  return (
    <Section id="gift" eyebrow="GIFT" title="마음 전하실 곳">
      <p className="poem small">
        참석이 어려워 직접 축하를 전하지 못하는 분들을 위해{'\n'}계좌번호를 안내해 드립니다.
      </p>
      <Accordion id="groom-accounts" side="신랑" list={config.accounts.groom} />
      <Accordion id="bride-accounts" side="신부" list={config.accounts.bride} />
    </Section>
  )
}
