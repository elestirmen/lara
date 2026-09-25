import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/e2e',timeout:45000,fullyParallel:false,workers:1,use:{baseURL:process.env.TEST_URL??'http://127.0.0.1:18742',headless:true,screenshot:'only-on-failure',trace:'retain-on-failure'},reporter:[['list'],['html',{open:'never'}]]});
