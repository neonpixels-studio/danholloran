---
created_at: '2022-09-04T15:42:00.000-05:00'
tags:
  - Community
  - Link
image: "/images/posts/avoid-using-else.jpg"
title: Avoid Using Else

---
I  agree with this [post](https://freek.dev/2212-avoid-using-else) from [Freek Van der Herten](https://freek.dev). Avoiding `else` is one thing I feel makes for a quick win when refactoring code. I feel like if you want to add `else` you should leave a reason why as a comment. Try this you may find you no longer need `else` but can refactor to something cleaner.

I think avoiding `else` pairs nicely with having many small named functions. Sure it adds more lines of code. However, it is nice when functions are named well with less nested code. Which I find easier to read and understand.

I believe avoiding else is a good rule of thumb. I've almost entirely removed `else` from my code. However, with a good reason I would still use `else` if there is not a better solution.