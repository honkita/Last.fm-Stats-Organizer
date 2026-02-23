[![](https://raw.githubusercontent.com/honkita/PixelButtons/main/Pixel_GitHub.svg)](https://github.com/honkita) [![](https://raw.githubusercontent.com/honkita/PixelButtons/main/Pixel_Link.svg)](https://elitelu.com) [![](https://raw.githubusercontent.com/honkita/PixelButtons/main/Pixel_LinkedIn.svg)](https://www.linkedin.com/in/elitelu/)

# Last.fm Stats Organizer

![](https://raw.githubusercontent.com/honkita/PixelButtons/main/Pixel_Maintained.svg)

---

## About

Originally, this project was a simple script to fetch and clean my Last.fm data for personal use. However, I decided to turn it into a web application to make it accessible to others who might want to do the same with their Last.fm data. The app allows users to input their Last.fm username and API key, fetches their listening history, and organizes it in a more user-friendly way.

## FAQ

### Why is the sum of the albums not equal to the total number of scrobbles for the artist?

This is because some scrobbles are tagged with an empty album name or a single. These scrobbles are still counted towards the total number of scrobbles for the artist, but they are not included in the album count since they lack an album name.

TL:DR: Blame the metadata.

### Why is my account not showing up?

This does NOT work with a private Last.fm account. You need to make your account public for the app to fetch your data.
