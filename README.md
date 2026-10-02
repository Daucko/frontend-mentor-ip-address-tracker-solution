# Frontend Mentor - IP address tracker solution

This is a solution to the [IP address tracker challenge on Frontend Mentor](https://www.frontendmentor.io/challenges/ip-address-tracker-I8-0yYAH0). Frontend Mentor challenges help you improve your coding skills by building realistic projects.

## Table of contents

- [Overview](#overview)
  - [The challenge](#the-challenge)
  - [Screenshot](#screenshot)
  - [Links](#links)
- [My process](#my-process)
  - [Built with](#built-with)
  - [What I learned](#what-i-learned)
  - [Continued development](#continued-development)
  - [AI Collaboration](#ai-collaboration)
- [Author](#author)

## Overview

### The challenge

Users should be able to:

- View the optimal layout for each page depending on their device's screen size
- See hover states for all interactive elements on the page
- See their own IP address on the map on the initial page load
- Search for any IP addresses or domains and see the key information and location

### Screenshot

![](./screenshot.jpg)

### Links

- Solution URL: [Add solution URL here](https://github.com/Daucko/frontend-mentor-ip-address-tracker-solution)
- Live Site URL: [Add live site URL here](https://frontend-mentor-ip-address-tracker-two.vercel.app/)

## My process

### Built with

- Semantic HTML5 markup
- CSS custom properties
- Flexbox
- CSS Grid
- Mobile-first workflow
- Javascript

### What I learned

I used this project to learn how MAP APIs work and how to effectively consume them. A snippet of the API consumation is showed below:

```js
const map = L.map('map', { zoomControl: false }).setView([20, 0], 2);
L.control.zoom({ position: 'bottomright' }).addTo(map);
```

### Continued development

I want to focus more on my javaScript development.

### AI Collaboration

Since the project starter files has two files that instruct AI agents and Claude to not get involve in the execution of the project, the copilot in my VS Code was deactivated. But I made use of 'claude.ai' and 'Deepseek.ai' in my browser when I was trying to figure out which map API to use.

## Author

- Website - [Add your name here](https://www.daucode-portfolio.vercel.app)
- Frontend Mentor - [@yourusername](https://www.frontendmentor.io/profile/daucko)
- Twitter - [@yourusername](https://www.twitter.com/daucoooflife)
