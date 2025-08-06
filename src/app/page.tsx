// src/app/waitlistSample/page.tsx
import styles from "./styles.module.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Waitlist Sample — SessionClarity",
  robots: { index: false, follow: false },
};

export default function WaitlistSamplePage() {
  return (
    <main className={styles.page}>

      {/* HERO - TOP */}
      <section className={styles.heroTop}>
        <div className={styles.container}>
          <h1 className={styles.heroTopTitle}>
            Clarity is Coming. <br /> Join the Waitlist for <span className={styles.green}>SessionClarity</span>.
          </h1>
          <p className={styles.heroTopSubtitle}>
            Your letterboard sessions deserve more than scribbled notes. <br />
            Be among the first to experience effortless insights—with AI-generated reports that reveal strengths, patterns, and progress.
          </p>
          <Link href="/getStarted/page.tsx" className={styles.ctaButtonPrimary}>
            Join the Waitlist
          </Link>
          <p className={styles.subText}>
            Built by families and practitioners. Powered by insight.
          </p>
        </div>
      </section>

      {/* WHY JOIN */}
      <section className={styles.whyJoin}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Why Join the Waitlist?</h2>
          <ul className={styles.bulletListLarge}>
            <li>✅ <strong>Be first to access AI-generated reports.</strong> Get clear summaries from video/audio.</li>
            <li>✅ <strong>Save time, see progress.</strong> No more rewatching sessions; let SessionClarity handle note-taking and analysis instantly.</li>
            <li>✅ <strong>Advocate with data.</strong> Bring evidence rooted in presumed competence to IEP meetings and therapy teams.</li>
            <li>✅ <strong>Help shape the future.</strong> Early access members will share feedback and influence development.</li>
          </ul>
        </div>
      </section>

      {/* WHO'S IT FOR */}
      <section className={styles.whosForSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Who It’s For</h2>
          <p className={styles.whosForText}>
            <strong>Parents, Practitioners, and Educators</strong><br />
            If you believe in the potential of spelling as communication—we built this for you.
          </p>
          <p className={styles.whosForText}>
            <strong>Powered by the Movement</strong><br />
            Founded by parents and technologists committed to nonspeaking individuals. Our mission is to shift the narrative—one session at a time.
          </p>
        </div>
      </section>

      {/* CTA ROW */}
      <div className={styles.ctaRowBottom}>
        <span className={styles.orange}>👉 Be among the first to bring clarity to every session.</span>
        <Link href="/getStarted/page.tsx" className={styles.ctaButtonPrimary}>
            Join the Waitlist
        </Link>
      </div>

      {/* WHY WE BUILT */}
      <section className={styles.why}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Why We Built SessionClarity</h2>
          <p className={styles.body}>
            As parents of nonspeaking autistic individuals, we've lived the gaps, the doubts, and the daily heroism.  
            <br /><br />
            SessionClarity is our response—a product of lived experience, technical expertise, and the belief in presumed competence.
          </p>
        </div>
      </section>

      {/* MEET THE TEAM */}
      <section className={styles.teamSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Meet the Team</h2>
          <p className={styles.teamSubtitle}>
            Built by families of non-speaking learners. Informed by practitioners.
          </p>
          <div className={styles.teamGrid}>
            <div className={styles.teamMember}>
              <img src="/artiPicture.png" alt="Arti Bhatia" className={styles.teamPhoto} />
              <h3 className={styles.teamName}>Arti Bhatia</h3>
              <p className={styles.teamBio}>
                Arti is a parent of a non-speaking college student who began using a letterboard at 17—
                an experience that led her to pivot into autism innovation. She previously held
                leadership roles at Microsoft, AWS, and Dell. Today, she works with trusted family and
                practitioner networks worldwide.
              </p>
            </div>

            <div className={styles.teamMember}>
              <img src="/danPicture.jpg" alt="Dan Feshbach" className={styles.teamPhoto} />
              <h3 className={styles.teamName}>Dan Feshbach</h3>
              <p className={styles.teamBio}>
                Veteran autism advocate and entrepreneur, inspired by his 31-year-old autistic son who is a limited speaker. 
                He co-founded TeachTown (serving 120,000+ students), launched the Multiple autism tech accelerator, 
                and helped organize the Autism Impact Fund.
              </p>
            </div>

            <div className={styles.teamMember}>
              <img src="/farazPicture.jpg" alt="Faraz Abidi" className={styles.teamPhoto} />
              <h3 className={styles.teamName}>Faraz Abidi</h3>
              <p className={styles.teamBio}>
                Faraz is an AI engineer whose work in autism began while living with his autistic cousin and attending therapy sessions. 
                He’s created award-winning assistive tools and was previously the founding engineer and Director of Software at SprintRay, 
                one of the world’s top 3D printing companies.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTES */}
      <section className={styles.quotes}>
        <div className={styles.container}>
          <div className={styles.quoteGrid}>
            <figure className={styles.quoteCard}>
              <figcaption className={`${styles.quoteLabel} ${styles.green}`}>Parent Perspective</figcaption>
              <blockquote className={styles.quoteText}>
                “For the first time, I have a real record of my son’s growth — and I can share it
                with everyone who supports him: family, school, even our Medicaid team.”
              </blockquote>
            </figure>
            <figure className={styles.quoteCard}>
              <figcaption className={`${styles.quoteLabel} ${styles.green}`}>Practitioner Perspective</figcaption>
              <blockquote className={styles.quoteText}>
                “This turns our sessions into data-backed stories of success. It’s more than just
                notes — it’s evidence that empowers parents, educators, and spellers alike.”
              </blockquote>
            </figure>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className={styles.finalCta} id="waitlist">
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Ready to Join the Movement?</h2>
          <p className={styles.body}>
            Families and practitioners are reshaping what’s possible. Be among the first to access tools that clarify what happens in the session, display competence, save time, and build real inclusion.
          </p>
          <Link href="/getStarted/page.tsx" className={styles.ctaButtonPrimary}>
            Join the Waitlist
          </Link>
        </div>
      </section>
    </main>
  );
}