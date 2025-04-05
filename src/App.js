import React, { useState, useEffect } from 'react';
import speakerData from './data/speakers.json';
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
    const fifteenMinsBefore = new Date(sessionTime.getTime() - (15 * 60 * 1000));
    return now >= fifteenMinsBefore;
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

const JoinButton = ({ session, className, speaker, openRSVPModal }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const sessionTime = new Date(`${session.date}T${session.time}`);
    const sessionTimePlusHour = new Date(sessionTime.getTime() + (60 * 60 * 1000));
    const now = new Date();
    const active = isSessionActive(session.date, session.time);
    const isPast = now > sessionTimePlusHour;

    if (isPast) {
        return null;
    }

    if (active) {
        return (
            <a
                href={session.link}
                className={className}
                target="_blank"
                rel="noopener noreferrer"
            >
                Join
            </a>
        );
    }

    return (
        <button
            className={className}
            onClick={() => openRSVPModal(speaker)}
        >
            RSVP
        </button>
    );
};

const NextUp = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const nextSpeaker = getNextUp();

    if (!nextSpeaker) return <p>No upcoming sessions.</p>;

    const localTime = formatTimeToLocal(nextSpeaker.session.date, nextSpeaker.session.time);

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleRSVPSubmit = async (formData) => {
        console.log('RSVP submitted:', formData, 'for speaker:', nextSpeaker.name);
    };

    return (
        <div className="next-up">
            <div>
                <h2>Next: {nextSpeaker.name}</h2>
                <p>{nextSpeaker.role} at {nextSpeaker.organization}</p>
            </div>
            <p>📅 {nextSpeaker.session.date} | 🕒 {localTime}</p>
            <CountdownTimer targetDate={new Date(`${nextSpeaker.session.date}T${nextSpeaker.session.time}`)} />
            <div className="links">
                {isSessionActive(nextSpeaker.session.date, nextSpeaker.session.time) ? (
                    <a href={nextSpeaker.session.link} className="join-link" target="_blank" rel="noopener noreferrer">
                        Join
                    </a>
                ) : (
                    <button className="join-button" onClick={openModal}>
                        RSVP
                    </button>
                )}
                <a href={nextSpeaker.session.addToCalendar} className="calendar-link">Calendar</a>
            </div>

            {isModalOpen && (
                <RSVPModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    speaker={nextSpeaker}
                    onSubmit={handleRSVPSubmit}
                />
            )}
        </div>
    );
};

const SpeakerTimeline = ({ filter }) => {
    const [selectedSpeaker, setSelectedSpeaker] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = (speaker) => {
        setSelectedSpeaker(speaker);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        // Reset selected speaker after a brief delay to allow closing animation
        setTimeout(() => setSelectedSpeaker(null), 300);
    };

    const handleRSVPSubmit = async (formData) => {
        // We don't need to implement this separately as the modal component handles submission
        console.log('RSVP submitted:', formData, 'for speaker:', selectedSpeaker.name);
    };

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
                            <JoinButton
                                session={speaker.session}
                                className="join-button"
                                speaker={speaker}
                                openRSVPModal={openModal}
                            />
                            <a href={speaker.session.addToCalendar} className="calendar-button" target="_blank" rel="noopener noreferrer">Add to Calendar</a>
                        </div>
                    </div>
                );
            })}

            {selectedSpeaker && (
                <RSVPModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    speaker={selectedSpeaker}
                    onSubmit={handleRSVPSubmit}
                />
            )}
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
            <a href="#speakers" className="register-btn">Register Now</a>
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
                <p>Software, Medicine, & More</p>
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
            name: "Arnav Mahajan",
            role: "Event Coordinator",
            image: "/images/team/arnav.jpg"
        },
        {
            name: "Mridula Vasudevan",
            role: "Event Coordinator",
            image: "/images/team/mridula.jpg"
        },
        {
            name: "Riya Allamaneni",
            role: "Event Coordinator",
            image: "/images/team/riya.jpg"
        }
    ];

    return (
        <section className="team" id="team">
            <h2>Organizing Team</h2>
            <div className="team-grid">
                {teamMembers.map(member => (
                    <div key={member.name} className="team-member">
                        {member.image && (
                            <img src={member.image} alt={member.name} />
                        )}
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
            question: "Is there a cost to attend?",
            answer: "All sessions are completely free, courtesy of VT Seva."
        },
        {
            question: "Can I ask questions during the sessions?",
            answer: "Yes, each session will include a Q&A segment with the speaker."
        },
        {
            question: "Who can attend the webinars?",
            answer: "The webinars are open to all students, parents, and professionals interested in the respective fields."
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

const RSVPModal = ({ isOpen, onClose, speaker, onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        branch: '',
        questions: '',
        optIn: false
    });
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Prepare the data with speaker information
            const submissionData = {
                ...formData,
                speakerName: speaker.name,
                sessionDate: `${speaker.session.date} ${speaker.session.time}`
            };

            // Use the proxy setting instead of hardcoded URL
            const response = await fetch('/api/rsvp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Failed to submit RSVP');
            }

            // Call the onSubmit callback with the form data
            onSubmit(formData);
            setSuccess(true);
        } catch (err) {
            setError('There was an error submitting your RSVP. Please try again.');
            console.error('RSVP submission error:', err);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <button className="modal-close" onClick={onClose}>×</button>

                {!success ? (
                    <>
                        <h2>RSVP for {speaker.name}'s Session</h2>
                        <p className="session-info">
                            {speaker.session.date} at {formatTimeToLocal(speaker.session.date, speaker.session.time)}
                        </p>

                        <form onSubmit={handleSubmit} className="rsvp-form">
                            <div className="form-group">
                                <label htmlFor="name">Name *</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="branch">VT Seva Branch *</label>
                                <select
                                    id="branch"
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select a branch</option>
                                    <option value="Atlanta">Atlanta</option>
                                    <option value="Austin">Austin</option>
                                    <option value="Bay Area">Bay Area</option>
                                    <option value="Boston">Boston</option>
                                    <option value="Cary">Cary</option>
                                    <option value="Charlotte">Charlotte</option>
                                    <option value="Chicago">Chicago</option>
                                    <option value="Cincinnati">Cincinnati</option>
                                    <option value="Columbus">Columbus</option>
                                    <option value="Connecticut">Connecticut</option>
                                    <option value="Dallas">Dallas</option>
                                    <option value="Detroit">Detroit</option>
                                    <option value="Houston">Houston</option>
                                    <option value="Maryland">Maryland</option>
                                    <option value="Minneapolis">Minneapolis</option>
                                    <option value="Nashville">Nashville</option>
                                    <option value="New Jersey">New Jersey</option>
                                    <option value="North Jersey">North Jersey</option>
                                    <option value="Orlando">Orlando</option>
                                    <option value="San Antonio">San Antonio</option>
                                    <option value="Seattle">Seattle</option>
                                    <option value="St. Louis">St. Louis</option>
                                    <option value="Tampa">Tampa</option>
                                    <option value="Virginia">Virginia</option>
                                    <option value="Other">Other</option>
                                    <option value="custom">Other (Please specify)</option>
                                </select>
                                {formData.branch === 'custom' && (
                                    <input
                                        type="text"
                                        id="customBranch"
                                        name="customBranch"
                                        placeholder="Enter your branch"
                                        value={formData.customBranch || ''}
                                        onChange={handleChange}
                                        required
                                    />
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="questions">Questions for the Speaker</label>
                                <textarea
                                    id="questions"
                                    name="questions"
                                    value={formData.questions}
                                    onChange={handleChange}
                                    rows="3"
                                />
                            </div>

                            <div className="form-group checkbox">
                                <input
                                    type="checkbox"
                                    id="optIn"
                                    name="optIn"
                                    checked={formData.optIn}
                                    onChange={handleChange}
                                />
                                <label htmlFor="optIn">Subscribe to VT Seva newsletters</label>
                            </div>

                            {error && <p className="error-message">{error}</p>}

                            <button
                                type="submit"
                                className="submit-button"
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit RSVP'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="success-message">
                        <h2>Thank You for Your RSVP!</h2>
                        <p>You have successfully registered for {speaker.name}'s session.</p>
                        <p>Make sure you add this event to your calendar!</p>
                        <p>Check back here 15 minutes before the session for a join link!</p>
                        <button
                            className="close-button"
                            onClick={onClose}
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

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
                    <a href="#speakers" className="register-btn">Register Now</a>
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
                    <button className={filter === 'Finance' ? 'active' : ''} onClick={() => setFilter('Finance')}>Finance</button>
                </div>
            </section>

            <section className="timeline-section">
                <SpeakerTimeline filter={filter} />
            </section>

            <OrganizingTeam />

            <FAQ />

            <Footer />
        </div>
    );
};

export default App;
