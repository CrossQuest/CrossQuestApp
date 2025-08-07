import { Link } from "react-router-dom";
import { useContext } from "react";
import CurrentUserContext from "../contexts/current-user-context";
import "../styles/welcomePage.css";

export default function WelcomingPage() {
  const { currentUser } = useContext(CurrentUserContext);

  return (
    <div>
      <header className="header">
        <h1>Welcome To CrossQuest!</h1>
      </header>

      <section className="features-section">
        <div className="features-grid">
          {[
            {
              title: "Post",
              desc: "Post your High Score!",
            },
            {
              title: "Compete",
              desc: "Compete With Others!",
            },
            {
              title: "Strive to Win",
              desc: "Strive to get a lot of wins!.",
            },
          ].map((feature, idx) => (
            <div className="feature-card" key={idx}>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {!currentUser && (
        <section className="cta-section">
          <Link to="/sign-up" className="get-started-btn">
            Get Started!
          </Link>
        </section>
      )}
    </div>
  );
}
