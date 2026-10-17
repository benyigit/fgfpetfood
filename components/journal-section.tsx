"use client";

import { useState } from "react";

const stories = [
  { id: "bully", category: "Chew time", title: "Bully Sticks for Dogs: 7 Benefits of a 6-Inch Natural Dog Chew", image: "/assets/stories/bully-stick-story.webp", excerpt: "Chewing is part of a dog’s natural behavior. A suitable chew can turn treat time into an engaging little activity.", body: "The supplied article draft explores the natural chewing instinct, the texture of a bully stick and ways to make treat time more engaging. It also reminds readers that a chew is a treat, not a complete food, and that dogs should be supervised while enjoying it." },
  { id: "chicken", category: "Crunchy picks", title: "Chicken Feet for Dogs: A Naturally Crunchy Chew with Plenty to Enjoy", image: "/assets/stories/chicken-feet-story.jpg", excerpt: "A recognizable shape, a crunchy texture and an animal-based treat that brings a little variety to the treat cabinet.", body: "The supplied draft describes chicken feet as a distinctive chew with a naturally crunchy texture. It encourages pet parents to read the finished product label carefully and to treat every dog as an individual." },
  { id: "cow", category: "Treat ideas", title: "Cow Ears for Dogs: A Naturally Satisfying Chew Dogs Love to Explore", image: "/assets/stories/cow-ear-story.jpg", excerpt: "A cow ear is a different sort of snack: natural shape, distinctive texture and an enjoyable chew-time moment.", body: "The supplied article draft introduces cow ears as a simple, animal-based chew and describes how their shape and texture can make treat time more interesting. As with any chew, supervision and a size that suits the dog matter." },
];

export function JournalSection() {
  const [story, setStory] = useState<(typeof stories)[number] | null>(null);
  return <section id="journal" className="section-wrap journal-section">
    <div className="section-heading"><div><p className="eyebrow">From the journal</p><h2>Stories for <em>good dog days.</em></h2></div><a className="text-link" href="#journal-grid">Browse the journal <span aria-hidden="true">↗</span></a></div>
    <a className="pdf-visual-banner" href="#journal-grid" aria-label="Browse FGF journal stories"><img src="/assets/fgf-pdf-journal.webp" alt="A golden retriever at a laptop beside the hand-lettered Our Blog banner" /></a>
    <div className="journal-grid" id="journal-grid">{stories.map((item) => <article className="journal-card" key={item.id}><div className="journal-photo"><img src={item.image} alt={item.title} loading="lazy" /></div><div className="journal-card-body"><span className="journal-category">{item.category}</span><h3>{item.title}</h3><p>{item.excerpt}</p><button type="button" onClick={() => setStory(item)}>Read the story <span aria-hidden="true">→</span></button></div></article>)}</div>
    {story && <dialog className="site-dialog article-dialog" open aria-labelledby="story-title"><button className="dialog-close" type="button" onClick={() => setStory(null)} aria-label="Close">×</button><div className="article-content"><img className="article-hero" src={story.image} alt={story.title} /><span className="journal-category">{story.category} · From the supplied draft</span><h2 id="story-title">{story.title}</h2><p className="article-body">{story.excerpt}</p><p className="article-body">{story.body}</p><p className="article-note">Every dog is different. Keep an eye on chew time and choose a size that suits your dog.</p></div></dialog>}
  </section>;
}
