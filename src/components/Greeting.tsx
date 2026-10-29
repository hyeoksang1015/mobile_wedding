import { config } from '../config'
import { Icon, Section } from './common'

const { groom, bride, parents } = config
const parentNames = (list: typeof parents.groom) =>
  list
    .slice(0, 2)
    .map((p) => p.name)
    .join(' · ')

function ContactGroup({ title, list }: { title: string; list: typeof parents.groom }) {
  return (
    <div className="card contact-group">
      <p className="contact-head">
        <span className="dot" aria-hidden="true" />
        {title}
      </p>
      <ul>
        {list.map((p) => (
          <li key={p.role}>
            <div>
              <span className="tiny muted">{p.role}</span>
              <span>{p.name}</span>
            </div>
            {p.phone && (
              <div className="contact-actions">
                <a
                  className="round-btn primary"
                  href={`tel:${p.phone}`}
                  aria-label={`${p.name}에게 전화`}
                >
                  <Icon name="call" />
                </a>
                <a className="round-btn" href={`sms:${p.phone}`} aria-label={`${p.name}에게 문자`}>
                  <Icon name="mail" />
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Greeting() {
  return (
    <Section id="greeting" eyebrow="GREETING" title={config.greeting.title}>
      <figure className="photo-card">
        <img src={config.images.greeting} alt="신랑 신부 사진" loading="lazy" />
      </figure>
      <p className="poem">{config.greeting.body}</p>

      <div className="card parents">
        <p>
          {parentNames(parents.groom)} <small>의 {groom.order}</small> <b>{groom.firstName}</b>
        </p>
        <p>
          {parentNames(parents.bride)} <small>의 {bride.order}</small> <b>{bride.firstName}</b>
        </p>
      </div>

      <h3 className="sub-title">
        <Icon name="call" /> 혼주에게 연락하기
      </h3>
      <ContactGroup title="신랑측" list={parents.groom} />
      <ContactGroup title="신부측" list={parents.bride} />
    </Section>
  )
}
