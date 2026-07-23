import { Router } from 'express';
import { listingSsrPage, robots, sitemap } from './seo.controller.js';

const router = Router();

router.get('/sitemap.xml', sitemap);
router.get('/robots.txt', robots);
router.get('/ssr/listings/:slug', listingSsrPage);

export default router;
