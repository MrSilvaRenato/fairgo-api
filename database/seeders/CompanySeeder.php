<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        foreach (self::companies() as $data) {
            $slug = Str::slug($data['name']);
            // Ensure slug uniqueness
            $base = $slug;
            $i    = 2;
            while (Company::where('slug', $slug)->exists()) {
                $slug = $base . '-' . $i++;
            }

            Company::create([
                'user_id'         => null,
                'name'            => $data['name'],
                'slug'            => $slug,
                'abn'             => preg_replace('/\D/', '', $data['abn']),
                'abn_entity_name' => $data['name'],
                'abn_verified'    => true,
                'industry'        => $data['industry'],
                'description'     => $data['description'],
                'website'         => $data['website'],
                'logo_url'        => 'https://logo.clearbit.com/' . parse_url($data['website'], PHP_URL_HOST),
                'claimed'         => false,
                'is_stub'         => false,
                'verified_badge'  => false,
                'not_recommended' => false,
            ]);
        }
    }

    private static function companies(): array
    {
        return [
            // ── Telecommunications ────────────────────────────────────────────
            [
                'name'        => 'Telstra',
                'abn'         => '33051775556',
                'industry'    => 'telco',
                'website'     => 'https://www.telstra.com.au',
                'description' => 'Australia\'s largest telecommunications and technology company, providing mobile, broadband, and entertainment services.',
            ],
            [
                'name'        => 'Optus',
                'abn'         => '90052833208',
                'industry'    => 'telco',
                'website'     => 'https://www.optus.com.au',
                'description' => 'Australia\'s second-largest telco offering mobile, broadband, and business communications services.',
            ],
            [
                'name'        => 'TPG Telecom',
                'abn'         => '15093619] 012',
                'industry'    => 'telco',
                'website'     => 'https://www.tpg.com.au',
                'description' => 'Major Australian telco offering home broadband, mobile plans, and business connectivity.',
            ],
            [
                'name'        => 'Vodafone Australia',
                'abn'         => '76096304620',
                'industry'    => 'telco',
                'website'     => 'https://www.vodafone.com.au',
                'description' => 'Mobile and broadband provider operating as part of the TPG Telecom group.',
            ],
            [
                'name'        => 'iiNet',
                'abn'         => '48068628937',
                'industry'    => 'telco',
                'website'     => 'https://www.iinet.net.au',
                'description' => 'Perth-based internet service provider offering NBN, ADSL, phone, and entertainment bundles.',
            ],
            [
                'name'        => 'Aussie Broadband',
                'abn'         => '51764208551',
                'industry'    => 'telco',
                'website'     => 'https://www.aussiebroadband.com.au',
                'description' => 'Award-winning Australian NBN and business internet provider known for customer service.',
            ],
            [
                'name'        => 'Internode',
                'abn'         => '82052008024',
                'industry'    => 'telco',
                'website'     => 'https://www.internode.on.net',
                'description' => 'South Australian ISP providing NBN, ADSL, and voice services to residential and business customers.',
            ],
            [
                'name'        => 'Belong',
                'abn'         => '33051775556',
                'industry'    => 'telco',
                'website'     => 'https://www.belong.com.au',
                'description' => 'Telstra\'s lower-cost mobile and broadband brand for budget-conscious Australians.',
            ],
            [
                'name'        => 'Dodo',
                'abn'         => '41033706576',
                'industry'    => 'telco',
                'website'     => 'https://www.dodo.com',
                'description' => 'Budget internet, mobile, and energy provider for Australian households.',
            ],
            [
                'name'        => 'Exetel',
                'abn'         => '35136888630',
                'industry'    => 'telco',
                'website'     => 'https://www.exetel.com.au',
                'description' => 'Sydney-based NBN and mobile provider offering competitive no-lock-in plans.',
            ],

            // ── Banking & Finance ─────────────────────────────────────────────
            [
                'name'        => 'Commonwealth Bank',
                'abn'         => '48123123124',
                'industry'    => 'banking',
                'website'     => 'https://www.commbank.com.au',
                'description' => 'Australia\'s largest bank by market capitalisation, offering retail, business, and institutional banking.',
            ],
            [
                'name'        => 'Westpac',
                'abn'         => '33007457141',
                'industry'    => 'banking',
                'website'     => 'https://www.westpac.com.au',
                'description' => 'One of Australia\'s Big Four banks providing personal, business, and corporate banking services.',
            ],
            [
                'name'        => 'ANZ Bank',
                'abn'         => '11005357522',
                'industry'    => 'banking',
                'website'     => 'https://www.anz.com.au',
                'description' => 'Major Australian and New Zealand bank with a strong presence across Asia-Pacific.',
            ],
            [
                'name'        => 'NAB',
                'abn'         => '12004044937',
                'industry'    => 'banking',
                'website'     => 'https://www.nab.com.au',
                'description' => 'National Australia Bank, serving retail customers, businesses, and institutions.',
            ],
            [
                'name'        => 'Bendigo Bank',
                'abn'         => '11068049178',
                'industry'    => 'banking',
                'website'     => 'https://www.bendigobank.com.au',
                'description' => 'Community-owned Australian bank focused on retail and business banking across regional areas.',
            ],
            [
                'name'        => 'ING Australia',
                'abn'         => '24000893292',
                'industry'    => 'banking',
                'website'     => 'https://www.ing.com.au',
                'description' => 'Online bank offering high-interest savings accounts, home loans, and everyday banking.',
            ],
            [
                'name'        => 'Macquarie Bank',
                'abn'         => '46008583542',
                'industry'    => 'banking',
                'website'     => 'https://www.macquarie.com',
                'description' => 'Australian investment and retail bank known for home loans, savings accounts, and wealth management.',
            ],
            [
                'name'        => 'Suncorp Bank',
                'abn'         => '66010831722',
                'industry'    => 'banking',
                'website'     => 'https://www.suncorp.com.au',
                'description' => 'Queensland-based bank offering home loans, personal banking, and business finance.',
            ],
            [
                'name'        => 'Bank of Queensland',
                'abn'         => '32009656740',
                'industry'    => 'banking',
                'website'     => 'https://www.boq.com.au',
                'description' => 'Queensland bank providing personal loans, mortgages, and business banking.',
            ],
            [
                'name'        => 'St.George Bank',
                'abn'         => '92055513070',
                'industry'    => 'banking',
                'website'     => 'https://www.stgeorge.com.au',
                'description' => 'Westpac-owned retail bank providing home loans, personal banking, and business services.',
            ],

            // ── Insurance ─────────────────────────────────────────────────────
            [
                'name'        => 'NRMA Insurance',
                'abn'         => '42019223554',
                'industry'    => 'insurance',
                'website'     => 'https://www.nrma.com.au',
                'description' => 'Leading Australian general insurer for car, home, travel, and business insurance.',
            ],
            [
                'name'        => 'Budget Direct',
                'abn'         => '22036377782',
                'industry'    => 'insurance',
                'website'     => 'https://www.budgetdirect.com.au',
                'description' => 'Competitive online insurer offering car, home, travel, and life insurance products.',
            ],
            [
                'name'        => 'Allianz Australia',
                'abn'         => '15000122850',
                'industry'    => 'insurance',
                'website'     => 'https://www.allianz.com.au',
                'description' => 'Global insurer with strong presence in Australia for motor, home, travel, and commercial insurance.',
            ],
            [
                'name'        => 'RACV',
                'abn'         => '44004139... 311',
                'industry'    => 'insurance',
                'website'     => 'https://www.racv.com.au',
                'description' => 'Victorian motoring club offering roadside assistance, insurance, and travel services.',
            ],
            [
                'name'        => 'Youi',
                'abn'         => '37090264446',
                'industry'    => 'insurance',
                'website'     => 'https://www.youi.com.au',
                'description' => 'South African-founded insurer offering personalised car, home, and business insurance in Australia.',
            ],
            [
                'name'        => 'QBE Insurance',
                'abn'         => '82010807842',
                'industry'    => 'insurance',
                'website'     => 'https://www.qbe.com',
                'description' => 'ASX-listed global insurer providing business, motor, home, and workers compensation insurance.',
            ],
            [
                'name'        => 'Medibank',
                'abn'         => '47080890259',
                'industry'    => 'insurance',
                'website'     => 'https://www.medibank.com.au',
                'description' => 'Australia\'s largest private health insurer offering hospital, extras, and overseas student cover.',
            ],
            [
                'name'        => 'Bupa Australia',
                'abn'         => '81000057590',
                'industry'    => 'insurance',
                'website'     => 'https://www.bupa.com.au',
                'description' => 'Global health and care company providing health insurance, dental, and aged care services.',
            ],

            // ── Energy ────────────────────────────────────────────────────────
            [
                'name'        => 'AGL Energy',
                'abn'         => '74115061375',
                'industry'    => 'energy',
                'website'     => 'https://www.agl.com.au',
                'description' => 'Australia\'s largest private energy company providing electricity and gas to households and businesses.',
            ],
            [
                'name'        => 'Origin Energy',
                'abn'         => '30000051696',
                'industry'    => 'energy',
                'website'     => 'https://www.originenergy.com.au',
                'description' => 'Major Australian energy retailer and generator supplying electricity and gas nationwide.',
            ],
            [
                'name'        => 'EnergyAustralia',
                'abn'         => '99086014968',
                'industry'    => 'energy',
                'website'     => 'https://www.energyaustralia.com.au',
                'description' => 'One of Australia\'s largest electricity and gas retailers serving homes and businesses.',
            ],
            [
                'name'        => 'Alinta Energy',
                'abn'         => '96089058783',
                'industry'    => 'energy',
                'website'     => 'https://www.alintaenergy.com.au',
                'description' => 'Australian energy retailer providing electricity and gas with competitive rates.',
            ],
            [
                'name'        => 'Ergon Energy',
                'abn'         => '11121177884',
                'industry'    => 'energy',
                'website'     => 'https://www.ergon.com.au',
                'description' => 'Queensland government-owned electricity distributor serving regional and rural communities.',
            ],
            [
                'name'        => 'Powershop',
                'abn'         => '24104710109',
                'industry'    => 'energy',
                'website'     => 'https://www.powershop.com.au',
                'description' => 'Green energy retailer offering transparent pricing and carbon offset electricity plans.',
            ],

            // ── Retail ────────────────────────────────────────────────────────
            [
                'name'        => 'Woolworths',
                'abn'         => '88000014675',
                'industry'    => 'retail',
                'website'     => 'https://www.woolworths.com.au',
                'description' => 'Australia\'s largest supermarket chain with over 1,000 stores and an online shopping platform.',
            ],
            [
                'name'        => 'Coles',
                'abn'         => '11004089936',
                'industry'    => 'retail',
                'website'     => 'https://www.coles.com.au',
                'description' => 'Major Australian supermarket and retail chain providing groceries, fuel, and financial services.',
            ],
            [
                'name'        => 'Kmart Australia',
                'abn'         => '73004250944',
                'industry'    => 'retail',
                'website'     => 'https://www.kmart.com.au',
                'description' => 'Popular Australian discount department store chain known for affordable clothing, homewares, and toys.',
            ],
            [
                'name'        => 'Target Australia',
                'abn'         => '75004250944',
                'industry'    => 'retail',
                'website'     => 'https://www.target.com.au',
                'description' => 'Australian department store chain (Wesfarmers) offering clothing, homewares, and electronics.',
            ],
            [
                'name'        => 'Big W',
                'abn'         => '88000014675',
                'industry'    => 'retail',
                'website'     => 'https://www.bigw.com.au',
                'description' => 'Woolworths-owned discount variety retailer selling clothing, electronics, and general merchandise.',
            ],
            [
                'name'        => 'JB Hi-Fi',
                'abn'         => '80093220136',
                'industry'    => 'retail',
                'website'     => 'https://www.jbhifi.com.au',
                'description' => 'Australia\'s largest home entertainment retailer selling electronics, appliances, and music.',
            ],
            [
                'name'        => 'Harvey Norman',
                'abn'         => '54003237545',
                'industry'    => 'retail',
                'website'     => 'https://www.harveynorman.com.au',
                'description' => 'Australian retail chain selling computers, electronics, furniture, and whitegoods.',
            ],
            [
                'name'        => 'The Good Guys',
                'abn'         => '80093220136',
                'industry'    => 'retail',
                'website'     => 'https://www.thegoodguys.com.au',
                'description' => 'JB Hi-Fi-owned appliance and electronics retailer with stores across Australia.',
            ],
            [
                'name'        => 'Bunnings Warehouse',
                'abn'         => '26008672179',
                'industry'    => 'retail',
                'website'     => 'https://www.bunnings.com.au',
                'description' => 'Australia\'s largest home improvement and hardware retail chain.',
            ],
            [
                'name'        => 'ALDI Australia',
                'abn'         => '56075058743',
                'industry'    => 'retail',
                'website'     => 'https://www.aldi.com.au',
                'description' => 'German discount supermarket chain operating across Australia with private-label products.',
            ],
            [
                'name'        => 'IGA',
                'abn'         => '63000636086',
                'industry'    => 'retail',
                'website'     => 'https://www.iga.com.au',
                'description' => 'Independent Grocers of Australia, a network of independently owned supermarkets.',
            ],
            [
                'name'        => 'Dan Murphy\'s',
                'abn'         => '88000014675',
                'industry'    => 'retail',
                'website'     => 'https://www.danmurphys.com.au',
                'description' => 'Woolworths-owned liquor retail chain with one of Australia\'s largest selections of wine, beer, and spirits.',
            ],
            [
                'name'        => 'Chemist Warehouse',
                'abn'         => '62135239877',
                'industry'    => 'retail',
                'website'     => 'https://www.chemistwarehouse.com.au',
                'description' => 'Australia\'s largest pharmacy retailer with discounted health, beauty, and wellness products.',
            ],
            [
                'name'        => 'Priceline Pharmacy',
                'abn'         => '32002880073',
                'industry'    => 'retail',
                'website'     => 'https://www.priceline.com.au',
                'description' => 'Australian pharmacy and beauty retailer with loyalty programme and health services.',
            ],
            [
                'name'        => 'Myer',
                'abn'         => '83116352581',
                'industry'    => 'retail',
                'website'     => 'https://www.myer.com.au',
                'description' => 'Australia\'s largest department store chain offering fashion, cosmetics, homewares, and gifts.',
            ],

            // ── Airlines & Travel ─────────────────────────────────────────────
            [
                'name'        => 'Qantas Airways',
                'abn'         => '16009661901',
                'industry'    => 'airlines',
                'website'     => 'https://www.qantas.com',
                'description' => 'Australia\'s flag carrier and largest airline, operating domestic and international routes.',
            ],
            [
                'name'        => 'Virgin Australia',
                'abn'         => '36090670965',
                'industry'    => 'airlines',
                'website'     => 'https://www.virginaustralia.com',
                'description' => 'Australia\'s second-largest airline operating domestic and short-haul international flights.',
            ],
            [
                'name'        => 'Jetstar Airways',
                'abn'         => '33069720243',
                'industry'    => 'airlines',
                'website'     => 'https://www.jetstar.com',
                'description' => 'Qantas-owned low-cost carrier operating domestic and international budget flights.',
            ],
            [
                'name'        => 'Rex Airlines',
                'abn'         => '90057870122',
                'industry'    => 'airlines',
                'website'     => 'https://www.rex.com.au',
                'description' => 'Regional Express Airlines, Australia\'s largest independent regional airline.',
            ],
            [
                'name'        => 'Bonza',
                'abn'         => '37652521553',
                'industry'    => 'airlines',
                'website'     => 'https://www.flybonza.com',
                'description' => 'Australia\'s newest low-cost carrier connecting regional and underserved Australian routes.',
            ],

            // ── Logistics & Postal ────────────────────────────────────────────
            [
                'name'        => 'Australia Post',
                'abn'         => '28864970579',
                'industry'    => 'logistics',
                'website'     => 'https://www.auspost.com.au',
                'description' => 'Australia\'s national postal service providing parcel delivery, mail, and retail services.',
            ],
            [
                'name'        => 'StarTrack',
                'abn'         => '28864970579',
                'industry'    => 'logistics',
                'website'     => 'https://www.startrack.com.au',
                'description' => 'Australia Post\'s premium express freight and logistics arm for business deliveries.',
            ],
            [
                'name'        => 'Toll Group',
                'abn'         => '32006678417',
                'industry'    => 'logistics',
                'website'     => 'https://www.tollgroup.com',
                'description' => 'Major Australian logistics and freight company providing road, rail, sea, and air transport.',
            ],
            [
                'name'        => 'Couriers Please',
                'abn'         => '72107311492',
                'industry'    => 'logistics',
                'website'     => 'https://www.couriersplease.com.au',
                'description' => 'Australian parcel delivery network offering same-day and overnight courier services.',
            ],
            [
                'name'        => 'DHL Australia',
                'abn'         => '45000402162',
                'industry'    => 'logistics',
                'website'     => 'https://www.dhl.com/au',
                'description' => 'World\'s leading international express and logistics company operating in Australia.',
            ],

            // ── Streaming & Technology ────────────────────────────────────────
            [
                'name'        => 'Netflix Australia',
                'abn'         => '70616325388',
                'industry'    => 'streaming',
                'website'     => 'https://www.netflix.com',
                'description' => 'World\'s leading streaming service for TV shows, movies, and documentaries.',
            ],
            [
                'name'        => 'Stan',
                'abn'         => '43164603936',
                'industry'    => 'streaming',
                'website'     => 'https://www.stan.com.au',
                'description' => 'Australian streaming service jointly owned by Nine Entertainment and Fairfax Media.',
            ],
            [
                'name'        => 'Foxtel',
                'abn'         => '65003845093',
                'industry'    => 'streaming',
                'website'     => 'https://www.foxtel.com.au',
                'description' => 'Australia\'s leading pay television and streaming provider (Kayo, Binge, Foxtel Now).',
            ],
            [
                'name'        => 'Disney+',
                'abn'         => '83615801615',
                'industry'    => 'streaming',
                'website'     => 'https://www.disneyplus.com',
                'description' => 'Disney\'s streaming service offering Marvel, Star Wars, Pixar, National Geographic content in Australia.',
            ],
            [
                'name'        => 'Amazon Australia',
                'abn'         => '48160SSS132',
                'industry'    => 'retail',
                'website'     => 'https://www.amazon.com.au',
                'description' => 'Amazon\'s Australian marketplace and Prime subscription service for shopping and streaming.',
            ],
            [
                'name'        => 'Spotify Australia',
                'abn'         => '92156065845',
                'industry'    => 'streaming',
                'website'     => 'https://www.spotify.com/au',
                'description' => 'World\'s most popular music streaming service with podcasts and audiobooks in Australia.',
            ],
            [
                'name'        => 'Apple Australia',
                'abn'         => '46002510054',
                'industry'    => 'technology',
                'website'     => 'https://www.apple.com/au',
                'description' => 'Apple\'s Australian operations covering iPhone, Mac, iPad, App Store, and Apple services.',
            ],
            [
                'name'        => 'Google Australia',
                'abn'         => '61843289718',
                'industry'    => 'technology',
                'website'     => 'https://www.google.com.au',
                'description' => 'Google\'s Australian entity providing search, advertising, Google Workspace, and Cloud services.',
            ],

            // ── Food Delivery & Ride-share ─────────────────────────────────────
            [
                'name'        => 'Uber Australia',
                'abn'         => '53164440243',
                'industry'    => 'transport',
                'website'     => 'https://www.uber.com/au',
                'description' => 'Ride-sharing and food delivery platform operating in major Australian cities.',
            ],
            [
                'name'        => 'Menulog',
                'abn'         => '30120596016',
                'industry'    => 'food-delivery',
                'website'     => 'https://www.menulog.com.au',
                'description' => 'Australia\'s largest food delivery platform connecting customers with local restaurants.',
            ],
            [
                'name'        => 'DoorDash Australia',
                'abn'         => '12643254726',
                'industry'    => 'food-delivery',
                'website'     => 'https://www.doordash.com/au',
                'description' => 'American food delivery service operating across major Australian cities.',
            ],
            [
                'name'        => 'Deliveroo Australia',
                'abn'         => '78621940088',
                'industry'    => 'food-delivery',
                'website'     => 'https://www.deliveroo.com.au',
                'description' => 'UK-based food delivery platform operating in Australian capital cities.',
            ],
            [
                'name'        => 'DiDi Australia',
                'abn'         => '26621961269',
                'industry'    => 'transport',
                'website'     => 'https://www.didiglobal.com/au',
                'description' => 'Chinese ride-sharing company competing with Uber in major Australian cities.',
            ],
            [
                'name'        => 'Ola Australia',
                'abn'         => '71613671895',
                'industry'    => 'transport',
                'website'     => 'https://www.olacabs.com/au',
                'description' => 'Indian ride-sharing platform operating in Australian cities as an Uber alternative.',
            ],

            // ── Real Estate ──────────────────────────────────────────────────���
            [
                'name'        => 'REA Group',
                'abn'         => '31068349015',
                'industry'    => 'real-estate',
                'website'     => 'https://www.realestate.com.au',
                'description' => 'Operator of realestate.com.au, Australia\'s leading property listing and search platform.',
            ],
            [
                'name'        => 'Domain',
                'abn'         => '43094154364',
                'industry'    => 'real-estate',
                'website'     => 'https://www.domain.com.au',
                'description' => 'Australia\'s second-largest property marketplace for buying, selling, and renting.',
            ],
            [
                'name'        => 'Ray White',
                'abn'         => '87010106512',
                'industry'    => 'real-estate',
                'website'     => 'https://raywhite.com',
                'description' => 'Australia\'s largest real estate group with over 1,000 offices across Australasia.',
            ],
            [
                'name'        => 'LJ Hooker',
                'abn'         => '15000525218',
                'industry'    => 'real-estate',
                'website'     => 'https://ljhooker.com.au',
                'description' => 'Leading Australian real estate franchise for property sales, rentals, and management.',
            ],
            [
                'name'        => 'McGrath Real Estate',
                'abn'         => '96081330248',
                'industry'    => 'real-estate',
                'website'     => 'https://www.mcgrath.com.au',
                'description' => 'Premium Australian real estate agency specialising in residential sales and property management.',
            ],

            // ── Automotive ────────────────────────────────────────────────────
            [
                'name'        => 'Toyota Australia',
                'abn'         => '64009686097',
                'industry'    => 'automotive',
                'website'     => 'https://www.toyota.com.au',
                'description' => 'Toyota Motor Corporation Australia, the country\'s best-selling vehicle brand.',
            ],
            [
                'name'        => 'Hyundai Australia',
                'abn'         => '58008873770',
                'industry'    => 'automotive',
                'website'     => 'https://www.hyundai.com/au',
                'description' => 'Hyundai Motor Company Australia offering passenger cars, SUVs, and electric vehicles.',
            ],
            [
                'name'        => 'Carsales',
                'abn'         => '91005658245',
                'industry'    => 'automotive',
                'website'     => 'https://www.carsales.com.au',
                'description' => 'Australia\'s largest online automotive classifieds marketplace for new and used vehicles.',
            ],
            [
                'name'        => 'RAA',
                'abn'         => '90000020345',
                'industry'    => 'automotive',
                'website'     => 'https://www.raa.com.au',
                'description' => 'Royal Automobile Association of South Australia providing roadside assistance, insurance, and travel.',
            ],
            [
                'name'        => 'NRMA',
                'abn'         => '43000019625',
                'industry'    => 'automotive',
                'website'     => 'https://www.mynrma.com.au',
                'description' => 'National Roads and Motorists Association providing roadside assistance and motoring services.',
            ],

            // ── Health & Fitness ──────────────────────────────────────────────
            [
                'name'        => 'Anytime Fitness',
                'abn'         => '85109243197',
                'industry'    => 'fitness',
                'website'     => 'https://www.anytimefitness.com.au',
                'description' => 'World\'s largest fitness club chain with 24/7 gyms across Australia.',
            ],
            [
                'name'        => 'Fitness First Australia',
                'abn'         => '63104886269',
                'industry'    => 'fitness',
                'website'     => 'https://www.fitnessfirst.com.au',
                'description' => 'Major Australian gym chain offering fitness centres, group classes, and personal training.',
            ],
            [
                'name'        => 'F45 Training',
                'abn'         => '15615468825',
                'industry'    => 'fitness',
                'website'     => 'https://www.f45training.com.au',
                'description' => 'Australian-founded functional training fitness studios with franchises worldwide.',
            ],
            [
                'name'        => 'Snap Fitness',
                'abn'         => '78119736262',
                'industry'    => 'fitness',
                'website'     => 'https://www.snapfitness.com.au',
                'description' => '24/7 gym franchise with affordable memberships and convenient locations across Australia.',
            ],

            // ── Financial Services / Fintech ──────────────────────────────────
            [
                'name'        => 'Afterpay',
                'abn'         => '38001904120',
                'industry'    => 'fintech',
                'website'     => 'https://www.afterpay.com/au',
                'description' => 'Australian buy-now-pay-later service (now part of Block Inc) used by millions of shoppers.',
            ],
            [
                'name'        => 'Zip Co',
                'abn'         => '88138010745',
                'industry'    => 'fintech',
                'website'     => 'https://www.zip.co/au',
                'description' => 'ASX-listed buy-now-pay-later provider offering interest-free credit across Australia.',
            ],
            [
                'name'        => 'PayPal Australia',
                'abn'         => '93111195389',
                'industry'    => 'fintech',
                'website'     => 'https://www.paypal.com/au',
                'description' => 'Global digital payments platform widely used by Australian consumers and businesses.',
            ],
            [
                'name'        => 'CommSec',
                'abn'         => '60067327058',
                'industry'    => 'fintech',
                'website'     => 'https://www.commsec.com.au',
                'description' => 'Commonwealth Bank\'s online share trading platform, Australia\'s largest retail broker.',
            ],
            [
                'name'        => 'SelfWealth',
                'abn'         => '52154 ... 192',
                'industry'    => 'fintech',
                'website'     => 'https://www.selfwealth.com.au',
                'description' => 'Low-cost Australian online share trading platform with flat-fee brokerage.',
            ],
            [
                'name'        => 'Superhero',
                'abn'         => '61621697621',
                'industry'    => 'fintech',
                'website'     => 'https://www.superhero.com.au',
                'description' => 'Australian micro-investing and share trading app for retail investors.',
            ],

            // ── Government / Semi-Government Services ─────────────────────────
            [
                'name'        => 'NBN Co',
                'abn'         => '86136533741',
                'industry'    => 'telco',
                'website'     => 'https://www.nbnco.com.au',
                'description' => 'Government-owned company building and operating Australia\'s National Broadband Network.',
            ],
            [
                'name'        => 'Services Australia',
                'abn'         => '90 794 605 008',
                'industry'    => 'government',
                'website'     => 'https://www.servicesaustralia.gov.au',
                'description' => 'Australian Government agency delivering Centrelink, Medicare, and Child Support services.',
            ],

            // ── Hospitality & Accommodation ───────────────────────────────────
            [
                'name'        => 'Airbnb Australia',
                'abn'         => '89163289786',
                'industry'    => 'hospitality',
                'website'     => 'https://www.airbnb.com.au',
                'description' => 'Online marketplace for short-term rental accommodation and experiences across Australia.',
            ],
            [
                'name'        => 'Booking.com Australia',
                'abn'         => '43634415360',
                'industry'    => 'hospitality',
                'website'     => 'https://www.booking.com',
                'description' => 'Global online travel and accommodation booking platform with millions of Australian users.',
            ],
            [
                'name'        => 'Accor Hotels',
                'abn'         => '57008316527',
                'industry'    => 'hospitality',
                'website'     => 'https://www.accorhotels.com/au',
                'description' => 'Global hotel group operating Ibis, Mercure, Novotel, and Pullman brands across Australia.',
            ],
            [
                'name'        => 'Wotif',
                'abn'         => '33006678417',
                'industry'    => 'hospitality',
                'website'     => 'https://www.wotif.com',
                'description' => 'Australian online travel agency offering discounted hotel and flight bookings.',
            ],

            // ── Education ─────────────────────────────────────────────────────
            [
                'name'        => 'TAFE NSW',
                'abn'         => '69878104614',
                'industry'    => 'education',
                'website'     => 'https://www.tafensw.edu.au',
                'description' => 'NSW Government\'s vocational education and training provider with 130 locations.',
            ],
            [
                'name'        => 'SEEK',
                'abn'         => '46061606064',
                'industry'    => 'education',
                'website'     => 'https://www.seek.com.au',
                'description' => 'Australia\'s largest employment marketplace connecting job seekers with employers.',
            ],
        ];
    }
}
