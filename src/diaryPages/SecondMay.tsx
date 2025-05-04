import DiaryEntry from '../components/DiaryEntry';

export default function SecondMay() {
  return (
    <DiaryEntry
      title="Starting My Developer Diary"
      date="May 2, 2024"
      mood="creative"
      coverImage="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80"
      tags={["webdev", "portfolio", "reflection", "beginnings"]}
      content={
        <>
          <p>
            Today I decided to create this developer diary as part of my portfolio site. 
            I've been wanting to document my journey for a while now, and this feels like the perfect way to do it.
          </p>
          
          <p>
            Building this diary module was actually pretty interesting. I wanted something that felt personal but 
            still looked professional. I ended up creating a component that supports different moods, cover images, 
            and even calculates reading time automatically.
          </p>
          
          <h3>Why keep a developer diary?</h3>
          <p>
            There are a few reasons I think keeping a developer diary is valuable:
          </p>
          
          <ul>
            <li>It creates a record of my growth and learning over time</li>
            <li>Writing helps me process what I've learned and solidify my understanding</li>
            <li>It shows potential employers or clients my thought process and personality</li>
            <li>It forces me to reflect on my progress regularly</li>
          </ul>
          
          <h3>What's next?</h3>
          <p>
            I'm planning to update this diary at least once a week with:
          </p>
          
          <ul>
            <li>Technical challenges I've overcome</li>
            <li>New skills or technologies I'm learning</li>
            <li>Project updates and milestones</li>
            <li>Reflections on my development process</li>
          </ul>
          
          <p>
            For now, I need to add navigation between entries and maybe a filtering system for tags.
            I also want to create a nice animation for transitioning between entries.
          </p>
          
          <blockquote>
            <p>"The scariest moment is always just before you start." - Stephen King</p>
          </blockquote>
          
          <p>
            And with this entry, I've officially started. Let's see where this goes!
          </p>
        </>
      }
    />
  );
}