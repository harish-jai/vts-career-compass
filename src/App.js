import React, { useState, useEffect } from 'react';
import speakerData from './data/speakers.json';
import { Analytics } from "@vercel/analytics/react"
import './App.css'

const getNextUp = () => {
    const now = new Date();

    return speakerData
        .map(speaker => ({
            ...speaker,
            sessionDateTime: new Date(`${speaker.session.date}T${speaker.session.time}`)
        }))
        .filter(speaker => speaker.sessionDateTime > now)
        .sort((a, b) => a.sessionDateTime - b.sessionDateTime)[0];
};

const isSessionActive = (date, time) => {
    const sessionTime = new Date(`${date}T${time}`);
    const now = new Date();
    const thirtyMinsBefore = new Date(sessionTime.getTime() - (30 * 60 * 1000));
    return now >= thirtyMinsBefore;
};

const formatTimeToLocal = (date, time) => {
    const dateTime = new Date(`${date}T${time}`);
    const timeString = dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const tzAbbr = new Date().toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ')[2];
    return `${timeString} ${tzAbbr}`;
};

const CountdownTimer = ({ targetDate }) => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(targetDate));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft(targetDate));
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    function calculateTimeLeft(target) {
        const now = new Date();
        const diff = target - now;
        if (diff <= 0) return {};

        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((diff / (1000 * 60)) % 60),
            seconds: Math.floor((diff / 1000) % 60),
        };
    }

    return (
        <div className="countdown">
            {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
        </div>
    );
};

const JoinButton = ({ session, className }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const sessionTime = new Date(`${session.date}T${session.time}`);
    const now = new Date();
    const active = isSessionActive(session.date, session.time);
    const isPast = now > sessionTime;

    if (isPast) {
        return null;
    }

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {active ? (
                <a
                    href={session.link}
                    className={className}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Join
                </a>
            ) : (
                <button
                    className={`${className} disabled`}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={(e) => e.preventDefault()}
                >
                    Join
                </button>
            )}
            {showTooltip && !active && (
                <div className="tooltip">
                    Check back 30 minutes before the session
                </div>
            )}
        </div>
    );
};

const NextUp = () => {
    const nextSpeaker = getNextUp();
    if (!nextSpeaker) return <p>No upcoming sessions.</p>;

    const localTime = formatTimeToLocal(nextSpeaker.session.date, nextSpeaker.session.time);

    return (
        <div className="next-up">
            <div>
                <h2>Next: {nextSpeaker.name}</h2>
                <p>{nextSpeaker.role} at {nextSpeaker.organization}</p>
            </div>
            <p>📅 {nextSpeaker.session.date} | 🕒 {localTime}</p>
            <CountdownTimer targetDate={new Date(`${nextSpeaker.session.date}T${nextSpeaker.session.time}`)} />
            <div className="links">
                <JoinButton session={nextSpeaker.session} className="join-link" />
                <a href={nextSpeaker.session.addToCalendar} className="calendar-link">Calendar</a>
            </div>
        </div>
    );
};

const SpeakerTimeline = ({ filter }) => {
    const filteredSpeakers = speakerData.filter(speaker =>
        filter === 'All' || speaker.category === filter
    );

    return (
        <div className="timeline">
            {filteredSpeakers.map(speaker => {
                const localTime = formatTimeToLocal(speaker.session.date, speaker.session.time);
                return (
                    <div key={speaker.name} className="speaker-card">
                        <img src={speaker.image} alt={speaker.name} className="speaker-image" />
                        <h3>{speaker.name}</h3>
                        <h4>{speaker.role} at {speaker.organization}</h4>
                        <h4>📅 {speaker.session.date} | 🕒 {localTime}</h4>
                        <p>{speaker.blurb}</p>
                        <div className="speaker-buttons">
                            <JoinButton session={speaker.session} className="join-button" />
                            <a href={speaker.session.addToCalendar} className="calendar-button" target="_blank" rel="noopener noreferrer">Add to Calendar</a>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const HeroSection = () => (
    <section className="hero">
        <div className="hero-content">
            <h1>Career Compass Webinar Series</h1>
            <h2>March 23 - April 6, 2025</h2>
            <h3>Hosted by VT Seva</h3>
            <p className="hero-description">
                Join us for an inspiring series of webinars featuring industry leaders
                sharing their career journeys and insights.
                Sessions are on: 3/27, 3/29, 4/1, and 4/2.
            </p>
            <div className="hero-cta">
                <button className="primary-btn" onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSdHV62htVyRdhlXTzb2P9Duvp2MhXQApLRIk715QkZ-6tOwIQ/viewform', '_blank')}>Register Now</button>
                <button className="secondary-btn" onClick={() => window.open('https://calendar.google.com/calendar/embed?src=d75ef5e4adf0fab18c4fb14c4dbe9bd41cba29b9baa4768d54ebcf9afc8755a4%40group.calendar.google.com&ctz=America%2FNew_York', '_blank')}>Add Series to Calendar</button>
            </div>
        </div>
    </section>
);

const AboutSection = () => (
    <section className="about" id="about">
        <h2>About the Event</h2>
        <p>
            Career Compass is a comprehensive webinar series designed to guide students
            and young professionals through various career paths. Our speakers, industry
            leaders in Software, Medicine, and other fields, share their experiences,
            challenges, and insights to help you make informed career decisions.
        </p>
        <div className="event-highlights">
            <div className="highlight">
                <h3>Multiple Speakers</h3>
                <p>Industry experts and leaders</p>
            </div>
            <div className="highlight">
                <h3>Various Tracks</h3>
                <p>Software, Medicine, and More</p>
            </div>
            <div className="highlight">
                <h3>Interactive</h3>
                <p>Q&A sessions with speakers</p>
            </div>
        </div>
    </section>
);

const OrganizingTeam = () => {
    const teamMembers = [
        {
            name: "Harish Jaisankar",
            role: "Event Director, National Volunteer Relations Coordinator",
            image: "/images/team/harish.png"
        },
        {
            name: "Mridula",
            role: "Event Coordinator",
            image: "/images/team/mridula.png"
        },
        {
            name: "Riya Allamaneni",
            role: "Event Coordinator",
            image: "/images/team/riya.png"
        },
        {
            name: "Arnav Mahajan",
            role: "Event Coordinator",
            image: "/images/team/arnav.png"
        }
    ];

    return (
        <section className="team" id="team">
            <h2>Organizing Team</h2>
            <div className="team-grid">
                {teamMembers.map(member => (
                    <div key={member.name} className="team-member">
                        <img src={member.image} alt={member.name} />
                        <h3>{member.name}</h3>
                        <p>{member.role}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

const FAQ = () => {
    const faqs = [
        {
            question: "How do I join the webinars?",
            answer: "You'll receive a unique link for each session after registration. Click the 'Join Session' button when it's time."
        },
        {
            question: "Are the sessions recorded?",
            answer: "No, sessions will only be live."
        },
        {
            question: "Is there a cost to attend?",
            answer: "All sessions are completely free, courtesy of VT Seva."
        },
        {
            question: "Can I ask questions during the sessions?",
            answer: "Yes, each session will include a Q&A segment with the speaker."
        },
        {
            question: "Who can attend the webinars?",
            answer: "The webinars are open to all students and professionals interested in the respective fields."
        },
    ];

    return (
        <section className="faq" id="faq">
            <h2>Frequently Asked Questions</h2>
            <div className="faq-grid">
                {faqs.map((faq, index) => (
                    <div key={index} className="faq-item">
                        <h3>{faq.question}</h3>
                        <p>{faq.answer}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

const Footer = () => (
    <footer className="footer">
        <div className="footer-content">
            <div className="footer-section">
                <h3>Contact Us</h3>
                <p>Email: volunteer.relations@vtsworld.org</p>
                <p>Phone: (313) 870-8029</p>
            </div>
            <div className="footer-section">
                <h3>Follow Us</h3>
                <div className="social-links">
                    <a href="https://x.com/vtseva" target="_blank" rel="noopener noreferrer">X</a>
                    <a href="https://www.linkedin.com/company/vt-seva" target="_blank" rel="noopener noreferrer">LinkedIn</a>
                    <a href="https://tr.ee/EHMgV6l98Q" target="_blank" rel="noopener noreferrer">Instagram</a>
                    <a href="https://www.facebook.com/vtsworld" target="_blank" rel="noopener noreferrer">Facebook</a>
                </div>
            </div>
        </div>
        <div className="footer-bottom">
            <p>© 2025 VT Seva. All rights reserved.</p>
        </div>
    </footer>
);

const App = () => {
    const [filter, setFilter] = useState('All');

    return (
        <div className="career-compass">
            <nav className="navbar">
                <div className="logo">
                    <img src="/images/vtseva.png" alt="VT Seva Logo" className="navbar-logo" />
                </div>
                <div className="nav-links">
                    <a href="#about">About</a>
                    <a href="#speakers">Speakers</a>
                    <a href="#team">Team</a>
                    <a href="#faq">FAQ</a>
                    <button className="register-btn" onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSdHV62htVyRdhlXTzb2P9Duvp2MhXQApLRIk715QkZ-6tOwIQ/viewform', '_blank')}>Register Now</button>
                </div>
            </nav>

            <HeroSection />

            <section className="next-up-section sticky">
                <NextUp />
            </section>

            <AboutSection />

            <section className="filter-section" id="speakers">
                <h2>Speaker Timeline</h2>
                <div className="filter-buttons">
                    <button className={filter === 'All' ? 'active' : ''} onClick={() => setFilter('All')}>All</button>
                    <button className={filter === 'Software' ? 'active' : ''} onClick={() => setFilter('Software')}>Software</button>
                    <button className={filter === 'Medicine' ? 'active' : ''} onClick={() => setFilter('Medicine')}>Medicine</button>
                    <button className={filter === 'Other' ? 'active' : ''} onClick={() => setFilter('Other')}>Other</button>
                </div>
            </section>

            <section className="timeline-section">
                <SpeakerTimeline filter={filter} />
            </section>

            <OrganizingTeam />

            <FAQ />

            <Footer />

            <Analytics />
        </div>
    );
};

export default App;
