# Treatment images

Drop one PNG (or WebP) per treatment in this folder, then run `npm run images`
to generate the `<slug>.webp` renditions the site actually ships. The site globs
`*.webp` here (`src/data/treatments.ts`); any missing image falls back to
`/placeholder.svg`. The PNG masters are kept for re-encoding but are never
bundled, so their size does not affect page weight.

Required filenames (33):

1. shiro-abhyangam.webp
2. shirodhara.webp
3. shiro-pichu.webp
4. thalapothichil.webp
5. netra-tarpanam.webp
6. nasyam.webp
7. takra-dhara.webp
8. mukha-abhyangam.webp
9. navara-mukha-lepam.webp
10. ksheera-dhoomam.webp
11. paada-abhyangam.webp
12. shareera-abhyangam.webp
13. udwarthanam.webp
14. podi-kizhi.webp
15. elakizhi.webp
16. navara-kizhi.webp
17. pizhichil.webp
18. kashaya-dhara.webp
19. ksheera-dhara.webp
20. dhanyamla-dhara.webp
21. jambira-pinda-swedanam.webp
22. valuka-swedanam.webp
23. naadi-swedanam.webp
24. baspa-sweda.webp
25. greeva-vasti.webp
26. prishta-vasti.webp
27. kati-vasti.webp
28. jaanu-vasti.webp
29. kashaya-vasti.webp
30. matra-vasti.webp
31. yoni-prakshalanam.webp
32. pichu.webp
33. upanaha-lepam.webp

Recommended size: landscape, ~1200x800 (cards crop with `object-cover`).
