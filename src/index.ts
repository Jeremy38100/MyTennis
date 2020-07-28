import {launch, Browser, Page} from 'puppeteer';
import { prompt } from 'inquirer';

function sleep(ms = 0) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const loginPage = 'https://auth.fft.fr/auth/realms/master/protocol/openid-connect/auth?client_id=FED_MET&response_type=code&scope=openid&redirect_uri=https://tenup.fft.fr/user-auth/process';


async function promptCmd(message: string, type: any): Promise<string> {
  return (await prompt({type, message, name: 'value'})).value;
}

// Fill input on the Web browser
async function setInput(page: Page, selector: string, inputValue: string) {
  await page.$eval(selector, (el: HTMLInputElement, value) => el.value = value, inputValue);
}

// Fill on element on the Web browser
async function click(page: Page, selector: string) {
  await page.$eval(selector, (form: HTMLElement) => form.click());
}

(async () => {
  const username = await promptCmd('Identifiant', 'input');
  const pwd = await promptCmd('Password', 'password');

  const browser: Browser = await launch();
  const page = await browser.newPage();

  await page.goto(loginPage);
  await page.waitForSelector('#username'); // Wait page to load

  // Login
  await setInput(page, '#username', username);
  await setInput(page, '#password', pwd);
  await click(page, '[type=submit]');

  // Wait change page
  await page.waitForSelector('.nomPrenom');

  // Read data on this page
  const player = await page.evaluate(() => {
    // this code will be executed in the JS console of the web browser
    const name = document.querySelector('.nomPrenom').textContent;
    const club = document.querySelector('.club').textContent.trim();
    const defeat = Number(document.querySelector('.number-defeat .number').textContent);
    const victory = Number(document.querySelector('.number-victory .number').textContent);
    return {name, club, victory, defeat};
  });
  console.log(`${player.name} (${player.club}) : V: ${player.victory} / D: ${player.defeat}`)
  await browser.close();
})();