# 💡 Recovrly


## 🩺 Inspiration
Medical errors are the third leading cause of death in the U.S., with nonadherence to medications contributing to over $100 billion in preventable medical costs each year (Kleinsinger). Recovery, especially for older or chronically ill patients, is often lonely—60% of chronically ill patients report feelings of isolation (Theeke & Mallow).

Through conversations with cancer survivors, post-op patients, and nurses, we saw a gap in recovery: it’s isolating, confusing, and easy to fall behind. What if recovery didn’t feel like something you had to do alone? What if taking your medication became a joyful part of your day?

Enter Recovrly: a hybrid system that combines community-powered healing with joyful medication reminders via a friendly robot named Clamshell 🐶💊.

## 🌐 Recovrly App
Milestone Sharing: Post and celebrate recovery achievements (e.g., walking again, finishing a treatment).

Community Feed: Connect with users undergoing similar recoveries.

AI Chatbot: Ask illness-related questions to reduce anxiety and build understanding.

Medication Scheduler: Assign pill times and sync them to Clamshell.

## 🤖 Clamshell Robot
A physical medication box that opens and closes on schedule.

When it's time for medication, Clamshell opens up and displays a cheerful “Pill Time!” message from a friendly pug.

After an hour, it closes again to prevent unnecessary access.

Controlled remotely via the app for a punctual and personable routine.

## 🛠️ How We Built It
Frontend: React.js

Backend: JavaScript with a custom backend for user authentication, posts, and time-based pill events

Hardware: Arduino Uno + servo motor

Communication: Serial messaging at 9600 baud rate between the app and Arduino

Prototype: Built without a 3D printer—used origami, office supplies, and a lot of tape

We overcame cross-platform challenges, syncing frontend UX, backend logic, and Arduino hardware communication to create a seamless experience.

## 🧩 Challenges We Ran Into
Hardware Integration: Mimicking Arduino IDE’s communication strategy in JavaScript was tough.

No 3D Printer: We improvised a working robot using utensils and creativity.

App Complexity: Coordinating user login, posting, feed filtering, chatbots, and scheduler logic took massive debugging.

Time Management: In a 24-hour hackathon, every feature came at the cost of another—we had to make tough trade-offs.

## 🏆 Accomplishments We're Proud Of
We built a working robot that smiles and opens on time—powered entirely by software and Arduino.

Created a full-stack social recovery app from scratch.

Designed with empathy first—not just tech, but tools that comfort and connect.

Our users didn’t just use the app—they smiled at it. That means everything.

## 📚 What We Learned
Simplicity wins when rooted in empathy. A cheerful dog and simple lid > over-engineered complexity.

Hardware + software = team sport. Constant collaboration between coders and builders was key.

Hackathon scrappiness breeds creativity. No 3D printer? No problem. We became engineers with tape and cardboard.

## 🚀 What's Next for Recovrly
Wi-Fi Control for Clamshell: So users can place the robot wherever they like—not just next to their computer.

3D-Printed Housing: A durable, clean, and cute shell for Clamshell.

Real-World Feedback: Survey recovering patients to validate product-market fit.

Separate Product Paths: Test interest in robot + app independently and together to refine go-to-market strategy.

