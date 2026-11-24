import { invitation } from '../data/invitation';
import Actions from './actions';

const { couple, date, time, venue, hall, address, greeting, photo } = invitation;
const dateText = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date(`${date}T00:00:00+09:00`));
const locationQuery = encodeURIComponent(`${venue} ${address}`);

export default function Home() {
  return <main className="card">
    <header className="hero">
      <p className="eyebrow">WEDDING INVITATION</p>
      <div className="photo">
        {photo ? <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ''}${photo}`} alt="신랑·신부 사진" /> : <span>사진 자리<br /><small>public/couple.jpg를 넣어주세요</small></span>}
      </div>
      <h1>{couple}</h1>
      <p>{invitation.title}</p>
    </header>

    <section aria-labelledby="greeting">
      <h2 id="greeting">초대의 글</h2>
      <p className="greeting">{greeting}</p>
    </section>

    <section aria-labelledby="wedding-info">
      <h2 id="wedding-info">예식 안내</h2>
      <p className="large">{dateText}</p>
      <p>{time} · {venue} {hall}</p>
      <p className="note">현재 표시된 내용은 예시입니다. 공유 전에 실제 정보로 바꿔 주세요.</p>
    </section>

    <section aria-labelledby="location">
      <h2 id="location">오시는 길</h2>
      <p>{venue} {hall}</p>
      <address>{address}</address>
      <div className="map-links">
        <a target="_blank" rel="noopener noreferrer" href={`https://map.naver.com/p/search/${locationQuery}`}>네이버 지도 ↗</a>
        <a target="_blank" rel="noopener noreferrer" href={`https://map.kakao.com/link/search/${locationQuery}`}>카카오맵 ↗</a>
      </div>
    </section>

    <section aria-labelledby="share-title">
      <h2 id="share-title">함께해 주세요</h2>
      <Actions details={{ couple, date, time, venue, hall }} />
    </section>
    <footer>Made with love · 기본형 청첩장</footer>
  </main>;
}
