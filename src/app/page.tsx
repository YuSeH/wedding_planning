import { invitation } from '../data/invitation';
import Actions from './actions';
import Contributions from './contributions';

const { couple, date, time, venue, hall, address, greeting, photo } = invitation;
const [year, month, day] = date.split('-').map(Number);
const dateText = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(`${date}T00:00:00+09:00`));
const displayDate = `${year}. ${String(month).padStart(2, '0')}. ${String(day).padStart(2, '0')}.`;
const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
const calendarDays = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => index - firstWeekday + 1);
const names = couple.split(/\s*&\s*/);
const locationQuery = encodeURIComponent(`${venue} ${address}`);

export default function Home() {
  return <main className="invitation">
    <header className="cover">
      <div className="cover-top"><span>THE WEDDING OF</span><span>{year} · {String(month).padStart(2, '0')} · {String(day).padStart(2, '0')}</span></div>
      <div className="cover-art">
        {photo ? <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}${photo}`} alt="신랑·신부 사진" /> : <div className="cover-illustration" aria-label="식물 문양의 청첩장 표지" role="img">
          <svg viewBox="0 0 320 350" aria-hidden="true" focusable="false">
            <g fill="none" stroke="#7e886f" strokeWidth="1.4" strokeLinecap="round">
              <path d="M38 320c14-70 34-145 42-230M35 318c7-73 12-138 25-191M282 320c-14-70-34-145-42-230M285 318c-7-73-12-138-25-191" />
              <path d="M57 213c-14-6-20-24-22-39M69 195c12-13 16-30 17-49M43 259c-12-10-16-22-17-37M263 213c14-6 20-24 22-39M251 195c-12-13-16-30-17-49M277 259c12-10 16-22 17-37" />
              <path d="M60 151c-6-16-5-31 3-45M260 151c6-16 5-31-3-45" />
            </g>
            <g fill="#a7b19a" opacity=".85">
              <ellipse cx="35" cy="174" rx="7" ry="18" transform="rotate(-38 35 174)" />
              <ellipse cx="86" cy="146" rx="6" ry="17" transform="rotate(31 86 146)" />
              <ellipse cx="26" cy="223" rx="6" ry="17" transform="rotate(-29 26 223)" />
              <ellipse cx="285" cy="174" rx="7" ry="18" transform="rotate(38 285 174)" />
              <ellipse cx="234" cy="146" rx="6" ry="17" transform="rotate(-31 234 146)" />
              <ellipse cx="294" cy="223" rx="6" ry="17" transform="rotate(29 294 223)" />
            </g>
            <g fill="#d1bd94"><circle cx="82" cy="105" r="4" /><circle cx="238" cy="105" r="4" /><circle cx="160" cy="80" r="2" /></g>
          </svg>
          <span className="art-label">A DAY TO REMEMBER</span>
          <span className="art-title">The<br />Wedding</span>
          <span className="art-date">{displayDate}</span>
        </div>}
      </div>
      <div className="cover-names">
        <p className="eyebrow">WEDDING INVITATION</p>
        <h1>{names.length === 2 ? <>{names[0]}<span className="ampersand">&amp;</span>{names[1]}</> : couple}</h1>
        <p className="cover-subtitle">{invitation.title}</p>
        <p className="cover-when">{dateText} · {time}</p>
      </div>
      <a className="scroll-cue" href="#greeting">초대장을 펼쳐보세요 <span aria-hidden="true">↓</span></a>
    </header>

    <section className="introduction" aria-labelledby="greeting">
      <p className="section-kicker">01 <span /> INVITATION</p>
      <span className="section-symbol" aria-hidden="true">✳</span>
      <h2 id="greeting">초대의 글</h2>
      <p className="greeting">{greeting}</p>
      <p className="signature">{couple}</p>
    </section>

    <section className="schedule" aria-labelledby="wedding-info">
      <p className="section-kicker">02 <span /> THE DAY</p>
      <h2 id="wedding-info">예식 안내</h2>
      <p className="date-display">{displayDate}</p>
      <p className="date-detail">{dateText} · {time}</p>
      <div className="calendar" aria-label={`${year}년 ${month}월 달력, ${day}일 예식`}>
        <p className="calendar-title">{year} <span>/</span> {String(month).padStart(2, '0')}</p>
        <div className="calendar-grid" aria-hidden="true">
          {['일', '월', '화', '수', '목', '금', '토'].map(weekday => <span className="calendar-weekday" key={weekday}>{weekday}</span>)}
          {calendarDays.map((calendarDay, index) => calendarDay > 0
            ? <span key={index} className={calendarDay === day ? 'calendar-day wedding-day' : 'calendar-day'}>{calendarDay}</span>
            : <span key={index} />)}
        </div>
      </div>
      <p className="schedule-venue">{venue} <span>·</span> {hall}</p>
    </section>

    <section className="location" aria-labelledby="location">
      <p className="section-kicker">03 <span /> LOCATION</p>
      <h2 id="location">오시는 길</h2>
      <div className="location-rule" aria-hidden="true" />
      <p className="venue-name">{venue}</p>
      <p className="venue-hall">{hall}</p>
      <address>{address}</address>
      <div className="map-links">
        <a target="_blank" rel="noopener noreferrer" href={`https://map.naver.com/p/search/${locationQuery}`}>네이버 지도 <span aria-hidden="true">↗</span></a>
        <a target="_blank" rel="noopener noreferrer" href={`https://map.kakao.com/link/search/${locationQuery}`}>카카오맵 <span aria-hidden="true">↗</span></a>
      </div>
    </section>

    <Contributions />

    <section className="closing" aria-labelledby="share-title">
      <p className="section-kicker">WITH LOVE</p>
      <h2 id="share-title">함께해 주세요</h2>
      <p>소중한 날, 귀한 걸음으로<br />함께해 주시면 감사하겠습니다.</p>
      <Actions details={{ couple, date, time, venue, hall }} />
    </section>
    <footer><p>WEDDING INVITATION · {year}</p><p>현재 표시된 이름과 예식 정보는 예시입니다.<br />공유 전에 실제 정보로 바꿔 주세요.</p></footer>
  </main>;
}