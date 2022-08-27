(() => {
var exports = {};
exports.id = "pages/api/graphql";
exports.ids = ["pages/api/graphql"];
exports.modules = {

/***/ "./lib/cors.js":
/*!*********************!*\
  !*** ./lib/cors.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
const allowCors = fn => async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || '*');
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader("Access-Control-Allow-Headers", "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  return await fn(req, res);
};

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (allowCors);

/***/ }),

/***/ "./pages/api/graphql.js":
/*!******************************!*\
  !*** ./pages/api/graphql.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "config": () => (/* binding */ config),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var apollo_server_micro__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! apollo-server-micro */ "apollo-server-micro");
/* harmony import */ var apollo_server_micro__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(apollo_server_micro__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lib_cors__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../lib/cors */ "./lib/cors.js");
/* harmony import */ var _src_graphql_server__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../src/graphql-server */ "./src/graphql-server/index.js");
/* harmony import */ var _src_graphql_server__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_src_graphql_server__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _src_services_user_service__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../src/services/user-service */ "./src/services/user-service/index.js");
/* harmony import */ var _src_services_user_service__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_src_services_user_service__WEBPACK_IMPORTED_MODULE_3__);




const apolloServer = new apollo_server_micro__WEBPACK_IMPORTED_MODULE_0__.ApolloServer(_src_graphql_server__WEBPACK_IMPORTED_MODULE_2___default()({
  apiPathPrefix: "/api",

  normaliseRequest({
    req
  }) {
    return req;
  },

  refreshUserToken({
    res
  }, newUserToken) {
    res.setHeader("Set-Cookie", `${(_src_services_user_service__WEBPACK_IMPORTED_MODULE_3___default().COOKIE_USER_TOKEN_NAME)}=${newUserToken}; HttpOnly; Max-Age=${(_src_services_user_service__WEBPACK_IMPORTED_MODULE_3___default().COOKIE_USER_TOKEN_MAX_AGE)}; Path=/`);
  }

}));
const config = {
  api: {
    bodyParser: false
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((0,_lib_cors__WEBPACK_IMPORTED_MODULE_1__.default)(apolloServer.createHandler({
  path: "/api/graphql"
})));

/***/ }),

/***/ "./src/graphql-server/create-context.js":
/*!**********************************************!*\
  !*** ./src/graphql-server/create-context.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const userService = __webpack_require__(/*! ../services/user-service */ "./src/services/user-service/index.js");

const getHost = __webpack_require__(/*! ../lib/get-host */ "./src/lib/get-host.js");

module.exports = function createContext({
  apiPathPrefix,
  normaliseRequest,
  refreshUserToken
}) {
  return function context(args) {
    const {
      cookies,
      headers
    } = normaliseRequest(args);
    const user = userService.authenticate(cookies[userService.COOKIE_USER_TOKEN_NAME]); // Refresh the user token (if available)

    if (user && refreshUserToken) {
      const newUserToken = userService.validateRefreshToken({
        refreshToken: cookies[userService.COOKIE_REFRESH_TOKEN_NAME],
        email: user.email
      });

      if (newUserToken) {
        refreshUserToken(args, newUserToken);
      }
    } // Determine the URL for webhook callbacks (ex: https://service-api.example.com/api)


    const publicHost = getHost({
      headers
    }) + apiPathPrefix;
    /**
     * serviceCallbackHost is used for third party services callbacks
     * It will be used in e.g. payment provider services callbacks
     * when async operations are finished
     *
     * Example for local development:
     *  - publicHost: http://localhost:3001/api
     *  - serviceCallbackHost: https://abcdefgh12345.ngrok.io/api
     *
     * Example for prod development:
     *  - publicHost: https://my-service-api.shop.com/api
     *  - serviceCallbackHost: https://my-service-api.shop.com/api
     */

    let serviceCallbackHost = process.env.SERVICE_CALLBACK_HOST;

    if (serviceCallbackHost) {
      if (!serviceCallbackHost.endsWith(apiPathPrefix)) {
        serviceCallbackHost += apiPathPrefix;
      }
    } else {
      serviceCallbackHost = publicHost;
    }

    return {
      user,
      publicHost,
      serviceCallbackHost
    };
  };
};

/***/ }),

/***/ "./src/graphql-server/index.js":
/*!*************************************!*\
  !*** ./src/graphql-server/index.js ***!
  \*************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const createContext = __webpack_require__(/*! ./create-context */ "./src/graphql-server/create-context.js");

const resolvers = __webpack_require__(/*! ./resolvers */ "./src/graphql-server/resolvers.js");

const typeDefs = __webpack_require__(/*! ./type-defs */ "./src/graphql-server/type-defs.js");

module.exports = function createGraphqlServerConfig({
  apiPathPrefix = "",
  refreshUserToken,
  normaliseRequest
}) {
  const context = createContext({
    apiPathPrefix,
    refreshUserToken,
    normaliseRequest
  });
  return {
    context,
    resolvers,
    typeDefs,
    introspection: true,
    playground: {
      endpoint: context.publicHost,
      settings: {
        "request.credentials": "include"
      }
    },
    // Disable subscriptions (not currently supported with ApolloGateway)
    subscriptions: false
  };
};

/***/ }),

/***/ "./src/graphql-server/resolvers.js":
/*!*****************************************!*\
  !*** ./src/graphql-server/resolvers.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const crystallize = __webpack_require__(/*! ../services/crystallize */ "./src/services/crystallize/index.js");

const basketService = __webpack_require__(/*! ../services/basket-service */ "./src/services/basket-service/index.js");

const userService = __webpack_require__(/*! ../services/user-service */ "./src/services/user-service/index.js");

const voucherService = __webpack_require__(/*! ../services/voucher-service */ "./src/services/voucher-service/index.js");

const stripeService = __webpack_require__(/*! ../services/payment-providers/stripe */ "./src/services/payment-providers/stripe/index.js");

const mollieService = __webpack_require__(/*! ../services/payment-providers/mollie */ "./src/services/payment-providers/mollie/index.js");

const vippsService = __webpack_require__(/*! ../services/payment-providers/vipps */ "./src/services/payment-providers/vipps/index.js");

const klarnaService = __webpack_require__(/*! ../services/payment-providers/klarna */ "./src/services/payment-providers/klarna/index.js");

const paypalService = __webpack_require__(/*! ../services/payment-providers/paypal */ "./src/services/payment-providers/paypal/index.js");

const invoiceService = __webpack_require__(/*! ../services/payment-providers/invoice */ "./src/services/payment-providers/invoice/index.js");

function paymentProviderResolver(service) {
  return () => {
    return {
      enabled: service.enabled,
      config: service.frontendConfig
    };
  };
}

module.exports = {
  Query: {
    myCustomBusinessThing: () => ({
      whatIsThis: "This is an example of a custom query for GraphQL demonstration purpuses. Check out the MyCustomBusinnessQueries resolvers for how to resolve additional fields apart from the 'whatIsThis' field"
    }),
    basket: (parent, args, context) => basketService.get(_objectSpread(_objectSpread({}, args), {}, {
      context
    })),
    user: (parent, args, context) => userService.getUser({
      context
    }),
    orders: () => ({}),
    paymentProviders: () => ({}),
    voucher: (parent, args, context) => voucherService.get(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  MyCustomBusinnessQueries: {
    dynamicRandomInt() {
      console.log("dynamicRandomInt called");
      return parseInt(Math.random() * 100);
    }

  },
  PaymentProvidersQueries: {
    stripe: paymentProviderResolver(stripeService),
    klarna: paymentProviderResolver(klarnaService),
    vipps: paymentProviderResolver(vippsService),
    mollie: paymentProviderResolver(mollieService),
    paypal: paymentProviderResolver(paypalService),
    invoice: paymentProviderResolver(invoiceService)
  },
  OrderQueries: {
    get: (parent, args) => crystallize.orders.get(args.id)
  },
  Mutation: {
    user: () => ({}),
    paymentProviders: () => ({})
  },
  UserMutations: {
    sendMagicLink: (parent, args, context) => userService.sendMagicLink(_objectSpread(_objectSpread({}, args), {}, {
      context
    })),
    update: (parent, args, context) => userService.update(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  PaymentProvidersMutations: {
    stripe: () => ({}),
    klarna: () => ({}),
    mollie: () => ({}),
    vipps: () => ({}),
    paypal: () => ({}),
    invoice: () => ({})
  },
  StripeMutations: {
    createPaymentIntent: (parent, args, context) => stripeService.createPaymentIntent(_objectSpread(_objectSpread({}, args), {}, {
      context
    })),
    confirmOrder: (parent, args, context) => stripeService.confirmOrder(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  KlarnaMutations: {
    renderCheckout: (parent, args, context) => klarnaService.renderCheckout(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  MollieMutations: {
    createPayment: (parent, args, context) => mollieService.createPayment(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  VippsMutations: {
    initiatePayment: (parent, args, context) => vippsService.initiatePayment(_objectSpread(_objectSpread({}, args), {}, {
      context
    }))
  },
  PaypalMutation: {
    createPayment: (parent, args, context) => paypalService.createPaypalPayment(_objectSpread(_objectSpread({}, args), {}, {
      context,
      parent
    })),
    confirmPayment: (parent, args, context) => paypalService.confirmPaypalPayment(_objectSpread(_objectSpread({}, args), {}, {
      context,
      parent
    }))
  },
  InvoiceMutation: {
    createInvoice: (parent, args, context) => invoiceService.createCrystallizeOrder(_objectSpread(_objectSpread({}, args), {}, {
      context,
      parent
    }))
  }
};

/***/ }),

/***/ "./src/graphql-server/type-defs.js":
/*!*****************************************!*\
  !*** ./src/graphql-server/type-defs.js ***!
  \*****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const gql = __webpack_require__(/*! graphql-tag */ "graphql-tag");

module.exports = gql`
  scalar JSON

  type Query {
    myCustomBusinessThing: MyCustomBusinnessQueries!
    basket(basketModel: BasketModelInput!): Basket!
    user: User!
    paymentProviders: PaymentProvidersQueries!
    orders: OrderQueries!
    voucher(code: String!): VoucherResponse!
  }

  type VoucherResponse {
    voucher: Voucher
    isValid: Boolean!
  }

  type MyCustomBusinnessQueries {
    whatIsThis: String!
    dynamicRandomInt: Int!
  }

  type Basket {
    cart: [CartItem!]!
    total: Price!
    voucher: Voucher
  }

  type CartItem {
    sku: String!
    name: String
    path: String
    quantity: Int!
    vatType: VatType
    stock: Int
    price: Price
    priceVariants: [PriceVariant!]
    attributes: [Attribute!]
    images: [Image!]
  }

  type PriceVariant {
    price: Float
    identifier: String!
    currency: String!
  }

  type Attribute {
    attribute: String!
    value: String
  }

  type Image {
    url: String!
    variants: [ImageVariant!]
  }

  type ImageVariant {
    url: String!
    width: Int
    height: Int
  }

  type Price {
    gross: Float!
    net: Float!
    currency: String
    tax: Tax
    taxAmount: Float
    discount: Float!
  }

  type Tax {
    name: String
    percent: Float
  }

  type VatType {
    name: String!
    percent: Int!
  }

  type User {
    logoutLink: String!
    isLoggedIn: Boolean!
    email: String
    firstName: String
    middleName: String
    lastName: String
    meta: [KeyValuePair!]
  }

  type PaymentProvidersQueries {
    stripe: PaymentProvider!
    klarna: PaymentProvider!
    vipps: PaymentProvider!
    mollie: PaymentProvider!
    paypal: PaymentProvider!
    invoice: PaymentProvider!
  }

  type PaymentProvider {
    enabled: Boolean!
    config: JSON
  }

  type OrderQueries {
    get(id: String!): JSON
  }

  type Voucher {
    code: String!
    discountAmount: Int
    discountPercent: Float
  }

  type Mutation {
    user: UserMutations
    paymentProviders: PaymentProvidersMutations!
  }

  input BasketModelInput {
    locale: LocaleInput!
    cart: [SimpleCartItem!]!
    voucherCode: String
    crystallizeOrderId: String
    klarnaOrderId: String
  }

  input LocaleInput {
    locale: String!
    displayName: String
    appLanguage: String!
    crystallizeCatalogueLanguage: String
    crystallizePriceVariant: String
  }

  input SimpleCartItem {
    sku: String!
    path: String
    quantity: Int
    priceVariantIdentifier: String!
  }

  type UserMutations {
    sendMagicLink(
      email: String!
      redirectURLAfterLogin: String!
    ): SendMagicLinkResponse!
    update(input: UserUpdateInput!): User!
  }

  input UserUpdateInput {
    firstName: String
    middleName: String
    lastName: String
    meta: [KeyValuePairInput!]
  }

  type SendMagicLinkResponse {
    success: Boolean!
    error: String
  }

  input CheckoutModelInput {
    basketModel: BasketModelInput!
    customer: OrderCustomerInput
    confirmationURL: String!
    checkoutURL: String!
    termsURL: String!
  }

  input OrderCustomerInput {
    firstName: String
    lastName: String
    addresses: [AddressInput!]
  }

  input AddressInput {
    type: String
    email: String
    firstName: String
    middleName: String
    lastName: String
    street: String
    street2: String
    streetNumber: String
    postalCode: String
    city: String
    state: String
    country: String
    phone: String
  }

  type PaymentProvidersMutations {
    stripe: StripeMutations!
    klarna: KlarnaMutations!
    mollie: MollieMutations!
    vipps: VippsMutations!
    paypal: PaypalMutation!
    invoice: InvoiceMutation!
  }

  type StripeMutations {
    createPaymentIntent(
      checkoutModel: CheckoutModelInput!
      confirm: Boolean
      paymentMethodId: String
    ): JSON
    confirmOrder(
      checkoutModel: CheckoutModelInput!
      paymentIntentId: String!
    ): StripeConfirmOrderResponse!
  }

  type StripeConfirmOrderResponse {
    success: Boolean!
    orderId: String
  }

  type KlarnaMutations {
    renderCheckout(
      checkoutModel: CheckoutModelInput!
    ): KlarnaRenderCheckoutReponse!
  }

  type KlarnaRenderCheckoutReponse {
    html: String!
    klarnaOrderId: String!
    crystallizeOrderId: String!
  }

  type MollieMutations {
    createPayment(
      checkoutModel: CheckoutModelInput!
    ): MollieCreatePaymentResponse!
  }

  type MollieCreatePaymentResponse {
    success: Boolean!
    checkoutLink: String
    crystallizeOrderId: String!
  }

  type VippsMutations {
    initiatePayment(
      checkoutModel: CheckoutModelInput!
    ): VippsInitiatePaymentResponse!
  }

  type VippsInitiatePaymentResponse {
    success: Boolean!
    checkoutLink: String
    crystallizeOrderId: String!
  }

  type PaypalMutation {
    createPayment(checkoutModel: CheckoutModelInput!): PaypalPaymentResponse!
    confirmPayment(
      checkoutModel: CheckoutModelInput!
      orderId: String
    ): PaypalPaymentResponse!
  }

  type PaypalPaymentResponse {
    success: Boolean!
    orderId: String
  }

  type InvoiceMutation {
    createInvoice(checkoutModel: CheckoutModelInput!): CreateInvoiceMutation!
  }

  type CreateInvoiceMutation {
    success: Boolean!
    orderId: String
  }

  type KeyValuePair {
    key: String!
    value: String
  }

  input KeyValuePairInput {
    key: String!
    value: String
  }
`;

/***/ }),

/***/ "./src/lib/currency.js":
/*!*****************************!*\
  !*** ./src/lib/currency.js ***!
  \*****************************/
/***/ ((module) => {

function formatCurrency({
  amount,
  currency
}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}

module.exports = {
  formatCurrency
};

/***/ }),

/***/ "./src/lib/get-host.js":
/*!*****************************!*\
  !*** ./src/lib/get-host.js ***!
  \*****************************/
/***/ ((module) => {

module.exports = function getHost({
  headers
}) {
  // If behind a reverse proxy like AWS Elastic Beanstalk for instance
  const {
    "x-forwarded-proto": xprotocol,
    "x-forwarded-host": xhost
  } = headers;

  if (xprotocol && xhost) {
    return `${xprotocol}://${xhost}`;
  }

  if (process.env.HOST_URL) {
    return process.env.HOST_URL;
  }

  const {
    Host,
    host = Host
  } = headers;

  if (host && host.startsWith("localhost")) {
    return `http://${host}`;
  } // If hosted on Vercel


  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  if (!host) {
    throw new Error("Cannot determine host for the current request context");
  }

  return `https://${host}`;
};

/***/ }),

/***/ "./src/services/basket-service/calculate-voucher-discount-amount.js":
/*!**************************************************************************!*\
  !*** ./src/services/basket-service/calculate-voucher-discount-amount.js ***!
  \**************************************************************************/
/***/ ((module) => {

function truncateDecimalsOfNumber(originalNumber, numberOfDecimals = 2) {
  // toFixed() converts a number into a string by truncating it
  // with the number of decimals passed as parameter.
  const amountTruncated = originalNumber.toFixed(numberOfDecimals); // We use parseFloat() to return a transform the string into a number

  return parseFloat(amountTruncated);
}

function calculateVoucherDiscountAmount({
  voucher,
  amount
}) {
  // We assume that the voucher has the right format.
  // It either has `discountPercent` or `discountAmount`
  const isDiscountAmount = Boolean(voucher.discountAmount);

  if (isDiscountAmount) {
    return voucher.discountAmount;
  }

  const amountToDiscount = amount * voucher.discountPercent / 100;
  return truncateDecimalsOfNumber(amountToDiscount);
}

module.exports = {
  calculateVoucherDiscountAmount
};

/***/ }),

/***/ "./src/services/basket-service/get-products-from-crystallize.js":
/*!**********************************************************************!*\
  !*** ./src/services/basket-service/get-products-from-crystallize.js ***!
  \**********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Handle language specific VAT types.
 * VAT types in Crystallize gets a name and a percentage, and
 * you later assign products to the VAT types.
 * The percentage might not be the same for all regions, which
 * makes this a good place to make any overrides if needed.
 */
const VATOverrides = [{
  locale: "??",
  // "the locale.locale from the storefront locales here (example: en)"
  vatTypes: [{
    name: "Standard",
    percent: 50
  }]
}];
/**
 * Gets information for products using SKU for lookup.
 */

async function getProductsFromCrystallize({
  skus,
  locale
}) {
  if (skus.length === 0) {
    return [];
  }

  const language = locale.crystallizeCatalogueLanguage;

  const {
    callCatalogueApi,
    callSearchApi
  } = __webpack_require__(/*! ../crystallize/utils */ "./src/services/crystallize/utils.js");

  const pathsSet = new Set();
  let searchAfterCursor;

  async function getNextSearchPage() {
    var _searchAPIResponse$da;

    const searchAPIResponse = await callSearchApi({
      query: `
        query GET_PRODUCTS_BY_SKU ($skus: [String!], $after: String, $language: String!) {
          search (
            after: $after
            language: $language
            filter: {
              include: {
                skus: $skus
              }
            }
          ) {
            pageInfo {
              endCursor
              hasNextPage
            }
            edges {
              node {
                path
              }
            }
          }
        }
      `,
      variables: {
        skus,
        after: searchAfterCursor,
        language
      }
    });
    const {
      edges,
      pageInfo
    } = ((_searchAPIResponse$da = searchAPIResponse.data) === null || _searchAPIResponse$da === void 0 ? void 0 : _searchAPIResponse$da.search) || {};
    edges === null || edges === void 0 ? void 0 : edges.forEach(edge => pathsSet.add(edge.node.path));

    if (pageInfo !== null && pageInfo !== void 0 && pageInfo.hasNextPage) {
      searchAfterCursor = pageInfo.endCursor;
      await getNextSearchPage();
    }
  }

  await getNextSearchPage();
  /**
   * Enrich each product with more information
   * Gets all of the products with a single request
   * by composing the query dynamically
   */

  const paths = Array.from(pathsSet);
  const response = await callCatalogueApi({
    query: `{
      ${paths.map((path, index) => `
        product${index}: catalogue(path: "${path}", language: "${language}") {
          path
          ... on Product {
            id
            vatType {
              name
              percent
            }
            variants {
              id
              sku
              name
              stock
              priceVariants {
                price
                identifier
                currency
              }
              attributes {
                attribute
                value
              }
              images {
                url
                variants {
                  url
                  width
                  height
                }
              }
            }
          }
        }
      `)}
    }`
  });
  const vatTypeOverridesForLocale = VATOverrides.find(v => v.locale === locale.locale);
  return paths.map((_, i) => response.data[`product${i}`]).filter(p => !!p).map(function doVATOverride(product) {
    const vatTypeOverride = vatTypeOverridesForLocale === null || vatTypeOverridesForLocale === void 0 ? void 0 : vatTypeOverridesForLocale.vatTypes.find(v => v.name === product.vatType.name);

    if (vatTypeOverride) {
      product.vatType = vatTypeOverride;
    }

    return product;
  });
}

module.exports = {
  getProductsFromCrystallize
};

/***/ }),

/***/ "./src/services/basket-service/index.js":
/*!**********************************************!*\
  !*** ./src/services/basket-service/index.js ***!
  \**********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const _excluded = ["locale", "voucherCode"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

// Calculate the totals
function getTotals({
  cart,
  vatType
}) {
  return cart.reduce((acc, curr) => {
    const {
      quantity,
      price
    } = curr;

    if (price) {
      const priceToUse = price.discounted || price;
      acc.gross += priceToUse.gross * quantity;
      acc.net += priceToUse.net * quantity;
      acc.currency = price.currency;
    }

    return acc;
  }, {
    gross: 0,
    net: 0,
    tax: vatType,
    discount: 0,
    currency: "N/A"
  });
}

module.exports = {
  async get({
    basketModel,
    context
  }) {
    const {
      locale,
      voucherCode
    } = basketModel,
          basketFromClient = _objectWithoutProperties(basketModel, _excluded);
    /**
     * Resolve all the voucher codes to valid vouchers for the user
     */


    let voucher;

    if (voucherCode) {
      const voucherService = __webpack_require__(/*! ../voucher-service */ "./src/services/voucher-service/index.js");

      const response = await voucherService.get({
        code: voucherCode,
        context
      });

      if (response.isValid) {
        voucher = response.voucher;
      }
    }
    /**
     * Get all products from Crystallize
     */


    const {
      getProductsFromCrystallize
    } = __webpack_require__(/*! ./get-products-from-crystallize */ "./src/services/basket-service/get-products-from-crystallize.js");

    const productDataFromCrystallize = await getProductsFromCrystallize({
      skus: basketFromClient.cart.map(p => p.sku),
      locale
    });
    let vatType;
    /**
     * Compose the complete cart items enriched with
     * data from Crystallize
     */

    const cart = basketFromClient.cart.map(itemFromClient => {
      const product = productDataFromCrystallize.find(p => p.variants.some(v => v.sku === itemFromClient.sku));

      if (!product) {
        return null;
      }

      vatType = product.vatType;
      const variant = product.variants.find(v => v.sku === itemFromClient.sku);
      const {
        price,
        currency
      } = variant.priceVariants.find(pv => pv.identifier === itemFromClient.priceVariantIdentifier) || variant.priceVariants.find(p => p.identifier === "default");
      const gross = price;
      const net = price * 100 / (100 + vatType.percent);
      return _objectSpread({
        productId: product.id,
        productVariantId: variant.id,
        path: product.path,
        quantity: itemFromClient.quantity || 1,
        vatType,
        price: {
          gross,
          net,
          tax: vatType,
          currency
        }
      }, variant);
    }).filter(p => !!p); // Calculate the totals

    let total = getTotals({
      cart,
      vatType
    }); // Add a voucher

    let cartWithVoucher = cart;

    if (cart.length > 0 && voucher) {
      const {
        calculateVoucherDiscountAmount
      } = __webpack_require__(/*! ./calculate-voucher-discount-amount */ "./src/services/basket-service/calculate-voucher-discount-amount.js");

      const discountAmount = calculateVoucherDiscountAmount({
        voucher,
        amount: total.gross
      }); // Reduce the price for each item

      cartWithVoucher = cart.map(cartItem => {
        const portionOfTotal = cartItem.price.gross * cartItem.quantity / total.gross;
        /**
         * Each cart item gets a portion of the voucher that
         * is relative to their own portion of the total discount
         */

        const portionOfDiscount = discountAmount * portionOfTotal;
        const gross = cartItem.price.gross - portionOfDiscount / cartItem.quantity;
        const net = gross * 100 / (100 + cartItem.vatType.percent);
        return _objectSpread(_objectSpread({}, cartItem), {}, {
          price: _objectSpread(_objectSpread({}, cartItem.price), {}, {
            gross,
            net
          })
        });
      }); // Adjust totals

      total = getTotals({
        cart: cartWithVoucher,
        vatType
      });
      total.discount = discountAmount;
    }

    return {
      voucher,
      cart: cartWithVoucher,
      total
    };
  }

};

/***/ }),

/***/ "./src/services/crystallize/customers/create-customer.js":
/*!***************************************************************!*\
  !*** ./src/services/crystallize/customers/create-customer.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const {
  callPimApi,
  getTenantId
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function createCustomer(customer) {
  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: {
      input: _objectSpread({
        tenantId
      }, customer)
    },
    query: `
      mutation createCustomer(
        $input: CreateCustomerInput!
      ) {
        customer {
          create(
            input: $input
          ) {
            identifier
          }
        }
      }
    `
  });
  return response.data.customer.create;
};

/***/ }),

/***/ "./src/services/crystallize/customers/get-customer.js":
/*!************************************************************!*\
  !*** ./src/services/crystallize/customers/get-customer.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  callPimApi,
  getTenantId
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function getCustomer({
  identifier,
  externalReference
}) {
  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: {
      tenantId,
      identifier,
      externalReference
    },
    query: `
      query getCustomer(
        $tenantId: ID!
        $identifier: String
        $externalReference: CustomerExternalReferenceInput
      ){
        customer {
          get(
            tenantId: $tenantId
            identifier: $identifier
            externalReference: $externalReference
          ) {
            identifier
            firstName
            middleName
            lastName
            meta {
              key
              value
            }
          }
        }
      }
    `
  });
  return response.data.customer.get;
};

/***/ }),

/***/ "./src/services/crystallize/customers/index.js":
/*!*****************************************************!*\
  !*** ./src/services/crystallize/customers/index.js ***!
  \*****************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const create = __webpack_require__(/*! ./create-customer */ "./src/services/crystallize/customers/create-customer.js");

const update = __webpack_require__(/*! ./update-customer */ "./src/services/crystallize/customers/update-customer.js");

const get = __webpack_require__(/*! ./get-customer */ "./src/services/crystallize/customers/get-customer.js");

module.exports = {
  create,
  update,
  get
};

/***/ }),

/***/ "./src/services/crystallize/customers/update-customer.js":
/*!***************************************************************!*\
  !*** ./src/services/crystallize/customers/update-customer.js ***!
  \***************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const _excluded = ["identifier"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const {
  callPimApi,
  getTenantId
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function updateCustomer(_ref) {
  let {
    identifier
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  const tenantId = await getTenantId();
  const response = await callPimApi({
    variables: _objectSpread({
      tenantId,
      identifier
    }, rest),
    query: `
      mutation updateCustomer(
        $tenantId: ID!
        $identifier: String!
        $customer: UpdateCustomerInput!
      ) {
        customer {
          update(
            tenantId: $tenantId
            identifier: $identifier
            input: $customer
          ) {
            identifier
          }
        }
      }
    `
  });
  return response.data.customer.update;
};

/***/ }),

/***/ "./src/services/crystallize/index.js":
/*!*******************************************!*\
  !*** ./src/services/crystallize/index.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const orders = __webpack_require__(/*! ./orders */ "./src/services/crystallize/orders/index.js");

const customers = __webpack_require__(/*! ./customers */ "./src/services/crystallize/customers/index.js");

module.exports = {
  orders,
  customers
};

/***/ }),

/***/ "./src/services/crystallize/orders/create-order.js":
/*!*********************************************************!*\
  !*** ./src/services/crystallize/orders/create-order.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  callOrdersApi,
  normaliseOrderModel
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function createOrder(variables) {
  const response = await callOrdersApi({
    variables: normaliseOrderModel(variables),
    query: `
      mutation createOrder(
        $customer: CustomerInput!
        $cart: [OrderItemInput!]!
        $total: PriceInput
        $payment: [PaymentInput!]
        $additionalInformation: String
        $meta: [OrderMetadataInput!]
      ) {
        orders {
          create(
            input: {
              customer: $customer
              cart: $cart
              total: $total
              payment: $payment
              additionalInformation: $additionalInformation
              meta: $meta
            }
          ) {
            id
          }
        }
      }
    `
  });
  return response.data.orders.create;
};

/***/ }),

/***/ "./src/services/crystallize/orders/get-order.js":
/*!******************************************************!*\
  !*** ./src/services/crystallize/orders/get-order.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  callOrdersApi
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function getOrder(id) {
  const response = await callOrdersApi({
    variables: {
      id
    },
    query: `
      query getOrder($id: ID!){
        orders {
          get(id: $id) {
            id
            total {
              net
              gross
              currency
              tax {
                name
                percent
              }
            }
            meta {
              key
              value
            }
            additionalInformation
            payment {
              ... on StripePayment {
                provider
                paymentMethod
              }
              ... on PaypalPayment {
                provider
                orderId
              }
              ... on CustomPayment {
                provider
                properties {
                  property
                  value
                }
              }
              ... on KlarnaPayment {
                provider
                orderId
              }
            }
            cart {
              sku
              name
              quantity
              imageUrl
              price {
                net
                gross
                currency
              }
              meta {
                key
                value
              }
            }
            customer {
              identifier
              firstName
              middleName
              lastName
              birthDate
              companyName
              taxNumber
              addresses {
                type
                firstName
                middleName
                lastName
                street
                street2
                streetNumber
                postalCode
                city
                state
                country
                phone
                email
              }
            }
          }
        }
      }
    `
  });
  const order = response.data.orders.get;

  if (!order) {
    throw new Error(`Cannot retrieve order "${id}"`);
  }

  return order;
};

/***/ }),

/***/ "./src/services/crystallize/orders/index.js":
/*!**************************************************!*\
  !*** ./src/services/crystallize/orders/index.js ***!
  \**************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const create = __webpack_require__(/*! ./create-order */ "./src/services/crystallize/orders/create-order.js");

const update = __webpack_require__(/*! ./update-order */ "./src/services/crystallize/orders/update-order.js");

const get = __webpack_require__(/*! ./get-order */ "./src/services/crystallize/orders/get-order.js");

const waitForOrderToBePersistated = __webpack_require__(/*! ./wait-for-order-to-be-persistated */ "./src/services/crystallize/orders/wait-for-order-to-be-persistated.js");

module.exports = {
  create,
  update,
  get,
  waitForOrderToBePersistated
};

/***/ }),

/***/ "./src/services/crystallize/orders/update-order.js":
/*!*********************************************************!*\
  !*** ./src/services/crystallize/orders/update-order.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  callPimApi,
  normaliseOrderModel
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = async function updateOrder(id, variables) {
  const response = await callPimApi({
    variables: {
      id,
      input: normaliseOrderModel(variables)
    },
    query: `
      mutation updateOrder(
        $id: ID!
        $input: UpdateOrderInput!
      ) {
        order {
            update(
            id: $id,
            input: $input
          ) {
            id
          }
        }
      }
  `
  });
  return response.data.order.update;
};

/***/ }),

/***/ "./src/services/crystallize/orders/wait-for-order-to-be-persistated.js":
/*!*****************************************************************************!*\
  !*** ./src/services/crystallize/orders/wait-for-order-to-be-persistated.js ***!
  \*****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  callOrdersApi
} = __webpack_require__(/*! ../utils */ "./src/services/crystallize/utils.js");

module.exports = function waitForOrderToBePersistated({
  id
}) {
  let retries = 0;
  const maxRetries = 10;
  return new Promise((resolve, reject) => {
    (async function check() {
      const response = await callOrdersApi({
        query: `
          {
            orders {
              get(id: "${id}") {
                id
                createdAt
              }
            }
          }
        `
      });

      if (response.data && response.data.orders.get) {
        resolve();
      } else {
        retries += 1;

        if (retries > maxRetries) {
          reject(`Timeout out waiting for Crystallize order "${id}" to be persisted`);
        } else {
          setTimeout(check, 1000);
        }
      }
    })();
  });
};

/***/ }),

/***/ "./src/services/crystallize/utils.js":
/*!*******************************************!*\
  !*** ./src/services/crystallize/utils.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const _excluded = ["customer", "cart", "total", "voucher"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

const invariant = __webpack_require__(/*! invariant */ "invariant");

const fetch = __webpack_require__(/*! node-fetch */ "node-fetch");

const CRYSTALLIZE_TENANT_IDENTIFIER = process.env.CRYSTALLIZE_TENANT_IDENTIFIER;
const CRYSTALLIZE_ACCESS_TOKEN_ID = process.env.CRYSTALLIZE_ACCESS_TOKEN_ID;
const CRYSTALLIZE_ACCESS_TOKEN_SECRET = process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET;
invariant(CRYSTALLIZE_TENANT_IDENTIFIER, "Missing process.env.CRYSTALLIZE_TENANT_IDENTIFIER");

function createApiCaller(uri) {
  return async function callApi({
    query,
    variables,
    operationName
  }) {
    invariant(CRYSTALLIZE_ACCESS_TOKEN_ID, "Missing process.env.CRYSTALLIZE_ACCESS_TOKEN_ID");
    invariant(CRYSTALLIZE_ACCESS_TOKEN_SECRET, "Missing process.env.CRYSTALLIZE_ACCESS_TOKEN_SECRET");
    const response = await fetch(uri, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Crystallize-Access-Token-Id": CRYSTALLIZE_ACCESS_TOKEN_ID,
        "X-Crystallize-Access-Token-Secret": CRYSTALLIZE_ACCESS_TOKEN_SECRET
      },
      body: JSON.stringify({
        operationName,
        query,
        variables
      })
    });
    const json = await response.json();

    if (json.errors) {
      console.log(JSON.stringify(json.errors, null, 2));
    }

    return json;
  };
} // eslint-disable-next-line no-unused-vars


function normaliseOrderModel(_ref) {
  let {
    customer,
    cart,
    total,
    voucher
  } = _ref,
      rest = _objectWithoutProperties(_ref, _excluded);

  return _objectSpread(_objectSpread(_objectSpread(_objectSpread({}, rest), total && {
    total: {
      gross: total.gross,
      net: total.net,
      currency: total.currency,
      tax: total.tax
    }
  }), cart && {
    cart: cart.map(function handleOrderCartItem(item) {
      const {
        images = [],
        name,
        sku,
        productId,
        productVariantId,
        quantity,
        price
      } = item;
      return {
        name,
        sku,
        productId,
        productVariantId,
        quantity,
        price,
        imageUrl: images && images[0] && images[0].url
      };
    })
  }), customer && {
    customer: {
      identifier: customer.identifier,
      firstName: customer.firstName || null,
      lastName: customer.lastName || null,
      addresses: customer.addresses || [{
        type: "billing",
        email: customer.email || undefined
      }]
    }
  });
}

const getTenantId = function () {
  let tenantId;
  return async () => {
    if (tenantId) {
      return tenantId;
    }

    const tenantIdResponse = await callCatalogueApi({
      query: `
          {
            tenant {
              id
            }
          }
        `
    });
    tenantId = tenantIdResponse.data.tenant.id;
    return tenantId;
  };
}();
/**
 * Catalogue API is the fast read-only API to lookup data
 * for a given item path or anything else in the catalogue
 */


const callCatalogueApi = createApiCaller(`https://api.crystallize.com/${CRYSTALLIZE_TENANT_IDENTIFIER}/catalogue`);
/**
 * Search API is the fast read-only API to search across
 * all items and topics
 */

const callSearchApi = createApiCaller(`https://api.crystallize.com/${CRYSTALLIZE_TENANT_IDENTIFIER}/search`);
/**
 * Orders API is the highly scalable API to send/read massive
 * amounts of orders
 */

const callOrdersApi = createApiCaller(`https://api.crystallize.com/${CRYSTALLIZE_TENANT_IDENTIFIER}/orders`);
/**
 * The PIM API is used for doing the ALL possible actions on
 * a tenant or your user profile
 */

const callPimApi = createApiCaller("https://pim.crystallize.com/graphql");
module.exports = {
  normaliseOrderModel,
  callCatalogueApi,
  callSearchApi,
  callOrdersApi,
  callPimApi,
  getTenantId
};

/***/ }),

/***/ "./src/services/email-service/index.js":
/*!*********************************************!*\
  !*** ./src/services/email-service/index.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  sendEmail
} = __webpack_require__(/*! ./utils */ "./src/services/email-service/utils.js");

const sendOrderConfirmation = __webpack_require__(/*! ./order-confirmation */ "./src/services/email-service/order-confirmation.js");

const sendUserMagicLink = __webpack_require__(/*! ./user-magic-link */ "./src/services/email-service/user-magic-link.js");

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendUserMagicLink
};

/***/ }),

/***/ "./src/services/email-service/order-confirmation.js":
/*!**********************************************************!*\
  !*** ./src/services/email-service/order-confirmation.js ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = async function sendOrderConfirmation(orderId) {
  try {
    const mjml2html = __webpack_require__(/*! mjml */ "mjml");

    const {
      formatCurrency
    } = __webpack_require__(/*! ../../lib/currency */ "./src/lib/currency.js");

    const {
      orders
    } = __webpack_require__(/*! ../crystallize */ "./src/services/crystallize/index.js");

    const {
      sendEmail
    } = __webpack_require__(/*! ./utils */ "./src/services/email-service/utils.js");

    const order = await orders.get(orderId);
    const {
      email
    } = order.customer.addresses[0];

    if (!email) {
      return {
        success: false,
        error: "No email found for the customer"
      };
    }

    const {
      html
    } = mjml2html(`
      <mjml>
        <mj-body>
        <mj-section>
          <mj-column>
            <mj-text>
              <h1>Order Summary</h1>
              <p>Thanks for your order! This email contains a copy of your order for your reference.</p>
              <p>
                Order Number: <strong>#${order.id}</strong>
              </p>
              <p>
                First name: <strong>${order.customer.firstName}</strong><br />
                Last name: <strong>${order.customer.lastName}</strong><br />
                Email address: <strong>${email}</strong>
              </p>
              <p>
                Total: <strong>${formatCurrency({
      amount: order.total.gross,
      currency: order.total.currency
    })}</strong>
              </p>
            </mj-text>
            <mj-table>
              <tr style="border-bottom: 1px solid #ecedee; text-align: left;">
                <th style="padding: 0 15px 0 0;">Name</th>
                <th style="padding: 0 15px;">Quantity</th>
                <th style="padding: 0 0 0 15px;">Total</th>
              </tr>
              ${order.cart.map(item => `<tr>
                  <td style="padding: 0 15px 0 0;">${item.name} (${item.sku})</td>
                  <td style="padding: 0 15px;">${item.quantity}</td>
                  <td style="padding: 0 0 0 15px;">${formatCurrency({
      amount: item.price.gross * item.quantity,
      currency: item.price.currency
    })}</td>
                </tr>`)}
            </mj-table>
          </mj-column>
        </mj-section>
        </mj-body>
      </mjml>
    `);
    await sendEmail({
      to: email,
      subject: "Order summary",
      html
    });
    return {
      success: true
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error
    };
  }
};

/***/ }),

/***/ "./src/services/email-service/user-magic-link.js":
/*!*******************************************************!*\
  !*** ./src/services/email-service/user-magic-link.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  sendEmail
} = __webpack_require__(/*! ./utils */ "./src/services/email-service/utils.js");

module.exports = async function sendMagicLinkLogin({
  loginLink,
  email
}) {
  try {
    const mjml2html = __webpack_require__(/*! mjml */ "mjml");

    const {
      html
    } = mjml2html(`
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text>Hi there! Simply follow the link below to login.</mj-text>
              <mj-button href="${loginLink}" align="left">Click here to login</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `);
    await sendEmail({
      to: email,
      subject: "Magic link login",
      html
    });
    return {
      success: true
    };
  } catch (error) {
    console.log(error);
    return {
      success: false,
      error
    };
  }
};

/***/ }),

/***/ "./src/services/email-service/utils.js":
/*!*********************************************!*\
  !*** ./src/services/email-service/utils.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const invariant = __webpack_require__(/*! invariant */ "invariant");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;
module.exports = {
  sendEmail(args) {
    invariant(SENDGRID_API_KEY, "process.env.SENDGRID_API_KEY not defined");
    invariant(EMAIL_FROM, "process.env.EMAIL_FROM is not defined");

    const sgMail = __webpack_require__(/*! @sendgrid/mail */ "@sendgrid/mail");

    sgMail.setApiKey(SENDGRID_API_KEY);
    return sgMail.send(_objectSpread({
      from: EMAIL_FROM
    }, args));
  }

};

/***/ }),

/***/ "./src/services/payment-providers/invoice/create-crystallize-order.js":
/*!****************************************************************************!*\
  !*** ./src/services/payment-providers/invoice/create-crystallize-order.js ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

module.exports = async function createCrystallizeOrder({
  checkoutModel,
  context
}) {
  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const {
    basketModel,
    customer
  } = checkoutModel;
  const {
    user
  } = context; // Add the identifier from the current logged in user

  const customerWithCurrentLoggedInUser = _objectSpread({}, customer);

  if (user) {
    customerWithCurrentLoggedInUser.identifier = user.email;
  }

  const basket = await basketService.get({
    basketModel,
    context
  });
  /*
   * Use a Crystallize order and the fulfilment pipelines to
   * manage the lifecycle of the order
   */

  const crystallizeOrder = await crystallize.orders.create(_objectSpread(_objectSpread({}, basket), {}, {
    customer: customerWithCurrentLoggedInUser
  }));
  return {
    success: true,
    orderId: crystallizeOrder.id
  };
};

/***/ }),

/***/ "./src/services/payment-providers/invoice/index.js":
/*!*********************************************************!*\
  !*** ./src/services/payment-providers/invoice/index.js ***!
  \*********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Manual invoice "payment provider"
 *
 * All that this does is to allow an unpaid cart
 * to be stored in Crystallize
 */
const createCrystallizeOrder = __webpack_require__(/*! ./create-crystallize-order */ "./src/services/payment-providers/invoice/create-crystallize-order.js");

module.exports = {
  enabled: true,
  frontendConfig: {},
  createCrystallizeOrder
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/capture.js":
/*!**********************************************************!*\
  !*** ./src/services/payment-providers/klarna/capture.js ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * An example of how to capture an amount for on an
 * order. You would typically do this as a response to
 * an update of a Fulfilment Pipelane Stage change in
 * Crystallize (https://crystallize.com/learn/developer-guides/order-api/fulfilment-pipelines)
 */
module.exports = async function klarnaCapture({
  crystallizeOrderId
}) {
  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/klarna/utils.js"); // Retrieve the Crystallize order


  const crystallizeOrder = await crystallize.orders.get(crystallizeOrderId);
  const klarnaPayment = crystallizeOrder.payment.find(p => p.provider === "klarna");

  if (!klarnaPayment) {
    throw new Error(`Order ${crystallizeOrderId} has no Klarna payment`);
  }

  const klarnaOrderId = klarnaPayment.orderId;

  if (!klarnaOrderId) {
    throw new Error(`Order ${crystallizeOrderId} has no klarnaOrderId`);
  }

  const klarnaClient = await getClient(); // Capture the full amount for the order

  const {
    error,
    response
  } = await klarnaClient.ordermanagementV1.captures.capture(klarnaOrderId);
  console.log(error, response);
  /**
   * You would typically also move the order in the
   * fulfilment pipeline from a stage called e.g.
   * "created" to "purchased" here
   */
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/index.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/klarna/index.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const KLARNA_USERNAME = process.env.KLARNA_USERNAME;
const KLARNA_PASSWORD = process.env.KLARNA_PASSWORD;

const {
  getClient
} = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/klarna/utils.js");

const renderCheckout = __webpack_require__(/*! ./render-checkout */ "./src/services/payment-providers/klarna/render-checkout.js");

const push = __webpack_require__(/*! ./push */ "./src/services/payment-providers/klarna/push.js");

const capture = __webpack_require__(/*! ./capture */ "./src/services/payment-providers/klarna/capture.js");

module.exports = {
  enabled: Boolean(KLARNA_USERNAME && KLARNA_PASSWORD),
  frontendConfig: {},
  getClient,
  renderCheckout,
  push,
  capture
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/push.js":
/*!*******************************************************!*\
  !*** ./src/services/payment-providers/klarna/push.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = async function klarnaPush({
  crystallizeOrderId,
  klarnaOrderId
}) {
  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/klarna/utils.js");

  console.log("Klarna push", {
    crystallizeOrderId,
    klarnaOrderId
  });
  const klarnaClient = await getClient(); // Retrieve the Klarna order to get the payment status
  // Acknowledge the Klarna order

  await klarnaClient.ordermanagementV1.orders.acknowledge(klarnaOrderId);
  /**
   * You would typically also move the order in the
   * fulfilment pipeline from a stage called e.g.
   * "initial" to "created" here
   */
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/render-checkout.js":
/*!******************************************************************!*\
  !*** ./src/services/payment-providers/klarna/render-checkout.js ***!
  \******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

module.exports = async function renderCheckout({
  checkoutModel,
  context
}) {
  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/klarna/utils.js");

  const toKlarnaOrderModel = __webpack_require__(/*! ./to-klarna-order-model */ "./src/services/payment-providers/klarna/to-klarna-order-model.js");

  const {
    basketModel,
    customer,
    confirmationURL,
    termsURL,
    checkoutURL
  } = checkoutModel;
  const {
    serviceCallbackHost,
    user
  } = context;
  let {
    crystallizeOrderId,
    klarnaOrderId
  } = basketModel;
  const basket = await basketService.get({
    basketModel,
    context
  }); // Add the identifier from the current logged in user

  const customerWithCurrentLoggedInUser = _objectSpread({}, customer);

  if (user) {
    customerWithCurrentLoggedInUser.identifier = user.email;
  }
  /**
   * Use a Crystallize order and the fulfilment pipelines to
   * manage the lifecycle of the order
   */


  if (crystallizeOrderId) {
    await crystallize.orders.update(crystallizeOrderId, _objectSpread(_objectSpread({}, basket), {}, {
      customer: customerWithCurrentLoggedInUser
    }));
  } else {
    const crystallizeOrder = await crystallize.orders.create(_objectSpread(_objectSpread({}, basket), {}, {
      customer: customerWithCurrentLoggedInUser
    }));
    crystallizeOrderId = crystallizeOrder.id;
  } // Setup the confirmation URL


  const confirmation = new URL(confirmationURL.replace("{crystallizeOrderId}", crystallizeOrderId));
  confirmation.searchParams.append("klarnaOrderId", "{checkout.order.id}");

  const validKlarnaOrderModel = _objectSpread(_objectSpread({}, toKlarnaOrderModel(basket)), {}, {
    purchase_country: "NO",
    purchase_currency: basket.total.currency || "NOK",
    locale: "no-nb",
    merchant_urls: {
      terms: termsURL,
      checkout: checkoutURL,
      confirmation: confirmation.toString(),
      push: `${serviceCallbackHost}/webhooks/payment-providers/klarna/push?crystallizeOrderId=${crystallizeOrderId}&klarnaOrderId={checkout.order.id}`
    }
  });

  const klarnaClient = await getClient();
  /**
   * Hold the HTML snippet that will be used on the
   * frontend to display the Klarna checkout
   */

  let html = "";
  /**
   * There is already a Klarna order id for this user
   * session, let's use that and not create a new one
   */

  if (klarnaOrderId) {
    const {
      error,
      response
    } = await klarnaClient.checkoutV3.updateOrder(klarnaOrderId, validKlarnaOrderModel);

    if (!error) {
      html = response.html_snippet;
      klarnaOrderId = response.order_id;
    } else {
      throw new Error(error);
    }
  } else {
    const {
      error,
      response
    } = await klarnaClient.checkoutV3.createOrder(validKlarnaOrderModel);

    if (!error) {
      html = response.html_snippet;
      klarnaOrderId = response.order_id;
    } else {
      throw new Error(error);
    }
  }
  /**
   * The Crystallize order creating is asynchronous, so we have
   * to wait for the order to be fully persisted
   */


  await crystallize.orders.waitForOrderToBePersistated({
    id: crystallizeOrderId
  }); // Tag the Crystallize order with the Klarna order id

  await crystallize.orders.update(crystallizeOrderId, _objectSpread(_objectSpread({}, basket), {}, {
    payment: [{
      provider: "klarna",
      klarna: {
        orderId: klarnaOrderId
      }
    }]
  }));
  return {
    html,
    klarnaOrderId,
    crystallizeOrderId
  };
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/to-klarna-order-model.js":
/*!************************************************************************!*\
  !*** ./src/services/payment-providers/klarna/to-klarna-order-model.js ***!
  \************************************************************************/
/***/ ((module) => {

module.exports = function crystallizeToKlarnaOrderModel(basket) {
  const {
    total,
    cart
  } = basket;
  const order_amount = total.gross * 100;
  return {
    order_amount,
    order_tax_amount: order_amount - total.net * 100,
    order_lines: cart.map(({
      sku,
      quantity,
      price,
      name,
      productId,
      productVariantId,
      imageUrl
    }) => {
      const {
        gross,
        net,
        tax
      } = price;
      const unit_price = gross * 100;

      if (sku.startsWith("--voucher--")) {
        return {
          reference: sku,
          name,
          quantity: 1,
          unit_price,
          total_amount: unit_price,
          total_tax_amount: 0,
          tax_rate: 0,
          type: "discount"
        };
      }

      const total_amount = unit_price * quantity;
      const total_tax_amount = total_amount - net * quantity * 100;
      return {
        name,
        reference: sku,
        unit_price,
        quantity,
        total_amount,
        total_tax_amount,
        type: "physical",
        tax_rate: tax.percent * 100,
        image_url: imageUrl,
        merchant_data: JSON.stringify({
          productId,
          productVariantId,
          taxGroup: tax
        })
      };
    })
  };
};

/***/ }),

/***/ "./src/services/payment-providers/klarna/utils.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/klarna/utils.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Read more about how to talk to the Klarna API here:
 * https://developers.klarna.com/api/#introduction
 */
const invariant = __webpack_require__(/*! invariant */ "invariant");

const KLARNA_USERNAME = process.env.KLARNA_USERNAME;
const KLARNA_PASSWORD = process.env.KLARNA_PASSWORD;
let client;
module.exports = {
  getClient: () => {
    const {
      Klarna
    } = __webpack_require__(/*! @crystallize/node-klarna */ "@crystallize/node-klarna");

    invariant(KLARNA_USERNAME, "process.env.KLARNA_USERNAME is not defined");
    invariant(KLARNA_PASSWORD, "process.env.KLARNA_PASSWORD is not defined");

    if (!client && KLARNA_USERNAME && KLARNA_PASSWORD) {
      client = new Klarna({
        username: KLARNA_USERNAME,
        password: KLARNA_PASSWORD,
        apiEndpoint: "api.playground.klarna.com"
      });
    }

    return client;
  }
};

/***/ }),

/***/ "./src/services/payment-providers/mollie/create-payment.js":
/*!*****************************************************************!*\
  !*** ./src/services/payment-providers/mollie/create-payment.js ***!
  \*****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

module.exports = async function createMolliePayment({
  checkoutModel,
  context
}) {
  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/mollie/utils.js");

  const {
    basketModel,
    customer,
    confirmationURL
  } = checkoutModel;
  const {
    serviceCallbackHost,
    user
  } = context; // Add the identifier from the current logged in user

  const customerWithCurrentLoggedInUser = _objectSpread({}, customer);

  if (user) {
    customerWithCurrentLoggedInUser.identifier = user.email;
  }

  const basket = await basketService.get({
    basketModel,
    context
  });
  const {
    total
  } = basket;
  let {
    crystallizeOrderId
  } = basketModel;
  const isSubscription = false;
  /* Use a Crystallize order and the fulfilment pipelines to
   * manage the lifecycle of the order
   */

  if (crystallizeOrderId) {
    await crystallize.orders.update(crystallizeOrderId, _objectSpread(_objectSpread({}, basket), {}, {
      customer: customerWithCurrentLoggedInUser,
      meta: [{
        key: "isSubscription",
        value: isSubscription ? "yes" : "no"
      }]
    }));
  } else {
    const crystallizeOrder = await crystallize.orders.create(_objectSpread(_objectSpread({}, basket), {}, {
      customer: customerWithCurrentLoggedInUser,
      meta: [{
        key: "isSubscription",
        value: isSubscription ? "yes" : "no"
      }]
    }));
    crystallizeOrderId = crystallizeOrder.id;
  }

  const mollieClient = await getClient();
  const mollieCustomer = await mollieClient.customers.create({
    name: `${customer.firstName} ${customer.lastName}`.trim() || "Jane Doe",
    email: customer.addresses[0].email
  });
  const confirmation = new URL(confirmationURL.replace("{crystallizeOrderId}", crystallizeOrderId));
  const validMollieOrder = {
    amount: {
      currency: process.env.MOLLIE_DEFAULT_CURRENCY || total.currency.toUpperCase(),
      value: total.gross.toFixed(2)
    },
    customerId: mollieCustomer.id,
    sequenceType: "first",
    description: "Mollie test transaction",
    redirectUrl: confirmation.toString(),
    webhookUrl: `${serviceCallbackHost}/webhooks/payment-providers/mollie/order-update`,
    metadata: {
      crystallizeOrderId
    }
  };
  const mollieOrderResponse = await mollieClient.payments.create(validMollieOrder);

  if (isSubscription) {
    await mollieClient.customers_mandates.get(mollieOrderResponse.mandateId, {
      customerId: mollieCustomer.id
    }); // Define the start date for the subscription

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 15);
    startDate.toISOString().split("T")[0];
    await mollieClient.customers_subscriptions.create({
      customerId: mollieCustomer.id,
      amount: validMollieOrder.amount,
      times: 1,
      interval: "1 month",
      startDate,
      description: "Mollie Test subscription",
      webhookUrl: `${serviceCallbackHost}/webhooks/payment-providers/mollie/subscription-renewal`,
      metadata: {}
    });
  }

  return {
    success: true,
    checkoutLink: mollieOrderResponse._links.checkout.href,
    crystallizeOrderId
  };
};

/***/ }),

/***/ "./src/services/payment-providers/mollie/index.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/mollie/index.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  getClient
} = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/mollie/utils.js");

const toCrystallizeOrderModel = __webpack_require__(/*! ./to-crystallize-order-model */ "./src/services/payment-providers/mollie/to-crystallize-order-model.js");

const createPayment = __webpack_require__(/*! ./create-payment */ "./src/services/payment-providers/mollie/create-payment.js");

module.exports = {
  enabled: Boolean(process.env.MOLLIE_API_KEY),
  frontendConfig: {},
  getClient,
  toCrystallizeOrderModel,
  createPayment
};

/***/ }),

/***/ "./src/services/payment-providers/mollie/to-crystallize-order-model.js":
/*!*****************************************************************************!*\
  !*** ./src/services/payment-providers/mollie/to-crystallize-order-model.js ***!
  \*****************************************************************************/
/***/ ((module) => {

/**
 * TODO: review what happens to the General Order Vat Group on multiple tax groups
 * on order (mult. items having diff vatTypes, is it a thing?)
 */
module.exports = function mollieToCrystallizeOrderModel({
  mollieOrder,
  mollieCustomer
}) {
  const customerName = mollieCustomer.name.split(" ");
  return {
    customer: {
      identifier: mollieCustomer.email,
      firstName: customerName[0],
      middleName: customerName.slice(1, customerName.length - 1).join(),
      lastName: customerName[customerName.length - 1],
      birthDate: Date,
      addresses: [{
        type: "billing",
        firstName: customerName[0],
        middleName: customerName.slice(1, customerName.length - 1).join(),
        lastName: customerName[customerName.length - 1],
        street: "Test line1",
        street2: "Test line2",
        postalCode: "Test postal_code",
        city: "Test city",
        state: "Test state",
        country: "Test country",
        phone: "Test Phone",
        email: mollieCustomer.email
      }, {
        type: "delivery",
        firstName: customerName[0],
        middleName: customerName.slice(1, customerName.length - 1).join(),
        lastName: customerName[customerName.length - 1],
        street: "Test line1",
        street2: "Test line2",
        postalCode: "Test postal_code",
        city: "Test city",
        state: "Test state",
        country: "Test country",
        phone: "Test Phone",
        email: mollieCustomer.email
      }]
    },
    payment: [{
      provider: "custom",
      custom: {
        properties: [{
          property: "resource",
          value: mollieOrder.resource
        }, {
          property: "resource_id",
          value: mollieOrder.id
        }, {
          property: "mode",
          value: mollieOrder.mode
        }, {
          property: "method",
          value: mollieOrder.method
        }, {
          property: "status",
          value: mollieOrder.status
        }, {
          property: "profileId",
          value: mollieOrder.profileId
        }, {
          property: "mandateId",
          value: mollieOrder.mandateId
        }, {
          property: "customerId",
          value: mollieOrder.customerId
        }, {
          property: "sequenceType",
          value: mollieOrder.sequenceType
        }]
      }
    }]
  };
};

/***/ }),

/***/ "./src/services/payment-providers/mollie/utils.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/mollie/utils.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const invariant = __webpack_require__(/*! invariant */ "invariant");

const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY;
let client;
module.exports = {
  getClient: () => {
    invariant(MOLLIE_API_KEY, "process.env.MOLLIE_API_KEY is not defined");

    if (!client) {
      const {
        createMollieClient
      } = __webpack_require__(/*! @mollie/api-client */ "@mollie/api-client");

      client = createMollieClient({
        apiKey: process.env.MOLLIE_API_KEY
      });
    }

    return client;
  }
};

/***/ }),

/***/ "./src/services/payment-providers/paypal/confirm-payment.js":
/*!******************************************************************!*\
  !*** ./src/services/payment-providers/paypal/confirm-payment.js ***!
  \******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

async function confirmPaypalPayment({
  checkoutModel,
  orderId,
  context
}) {
  const checkoutNodeJssdk = __webpack_require__(/*! @paypal/checkout-server-sdk */ "@paypal/checkout-server-sdk");

  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const {
    paypal: PaypalClient
  } = __webpack_require__(/*! ./init-client */ "./src/services/payment-providers/paypal/init-client.js");

  const toCrystallizeOrderModel = __webpack_require__(/*! ./to-crystallize-order-model */ "./src/services/payment-providers/paypal/to-crystallize-order-model.js");

  try {
    const {
      basketModel
    } = checkoutModel;
    const basket = await basketService.get({
      basketModel,
      context
    });
    const response = await PaypalClient().execute(new checkoutNodeJssdk.orders.OrdersGetRequest(orderId));
    const order = await crystallize.orders.create(toCrystallizeOrderModel(basket, response.result));
    return {
      success: true,
      orderId: order.id
    };
  } catch (err) {
    console.error(err);
  }

  return {
    success: false
  };
}

module.exports = confirmPaypalPayment;

/***/ }),

/***/ "./src/services/payment-providers/paypal/create-payment.js":
/*!*****************************************************************!*\
  !*** ./src/services/payment-providers/paypal/create-payment.js ***!
  \*****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

async function createPaypalPayment({
  checkoutModel,
  context
}) {
  const paypal = __webpack_require__(/*! @paypal/checkout-server-sdk */ "@paypal/checkout-server-sdk");

  const {
    paypal: PaypalClient
  } = __webpack_require__(/*! ./init-client */ "./src/services/payment-providers/paypal/init-client.js");

  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const {
    basketModel
  } = checkoutModel; // Get a verified basket from the basket service

  const basket = await basketService.get({
    basketModel,
    context
  });
  const request = new paypal.orders.OrdersCreateRequest(); // Get the complete resource representation

  request.prefer("return=representation");
  request.requestBody({
    intent: "CAPTURE",
    purchase_units: [{
      amount: {
        currency_code: basket.total.currency,
        value: basket.total.gross.toString()
      }
    }]
  });
  let order;

  try {
    order = await PaypalClient().execute(request);
  } catch (err) {
    console.error(err);
    return {
      success: false
    };
  }

  return {
    success: true,
    orderId: order.result.id
  };
}

module.exports = createPaypalPayment;

/***/ }),

/***/ "./src/services/payment-providers/paypal/index.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/paypal/index.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const createPaypalPayment = __webpack_require__(/*! ./create-payment */ "./src/services/payment-providers/paypal/create-payment.js");

const confirmPaypalPayment = __webpack_require__(/*! ./confirm-payment */ "./src/services/payment-providers/paypal/confirm-payment.js");

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
module.exports = {
  enabled: Boolean(PAYPAL_CLIENT_ID && PAYPAL_CLIENT_SECRET),
  frontendConfig: {
    clientId: PAYPAL_CLIENT_ID,
    currency: ""
  },
  createPaypalPayment,
  confirmPaypalPayment
};

/***/ }),

/***/ "./src/services/payment-providers/paypal/init-client.js":
/*!**************************************************************!*\
  !*** ./src/services/payment-providers/paypal/init-client.js ***!
  \**************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function getClient() {
  const checkoutNodeJssdk = __webpack_require__(/*! @paypal/checkout-server-sdk */ "@paypal/checkout-server-sdk");

  const clientId = process.env.PAYPAL_CLIENT_ID || "PAYPAL-SANDBOX-CLIENT-ID";
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || "PAYPAL-SANDBOX-CLIENT-SECRET"; // const clientEnv =
  //   process.env.NODE_ENV === "production"
  //     ? new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret)
  //     : new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);

  const clientEnv = new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
  return new checkoutNodeJssdk.core.PayPalHttpClient(clientEnv);
}

module.exports = {
  paypal: getClient
};

/***/ }),

/***/ "./src/services/payment-providers/paypal/to-crystallize-order-model.js":
/*!*****************************************************************************!*\
  !*** ./src/services/payment-providers/paypal/to-crystallize-order-model.js ***!
  \*****************************************************************************/
/***/ ((module) => {

function toCrystallizeOrderModel(basket, order) {
  var _payer$name, _payer$name2, _payer$name3, _payer$name4;

  const {
    payer,
    purchase_units
  } = order;
  const {
    shipping
  } = purchase_units[0];
  const {
    address
  } = shipping;
  const orderId = order.id;
  /**
   * Use email or payer id as the customer identifier in Crystallize.
   */

  const identifier = order.payer.email_address || order.payer.payer_id;
  return {
    cart: basket.cart,
    total: basket.total,
    payment: [{
      provider: "paypal",
      paypal: {
        orderId
      }
    }],
    meta: [{
      key: "PAYPAL_ORDER_STATUS",
      value: order.status
    }],
    customer: {
      identifier,
      firstName: (payer === null || payer === void 0 ? void 0 : (_payer$name = payer.name) === null || _payer$name === void 0 ? void 0 : _payer$name.given_name) || "",
      middleName: "",
      lastName: (payer === null || payer === void 0 ? void 0 : (_payer$name2 = payer.name) === null || _payer$name2 === void 0 ? void 0 : _payer$name2.surname) || "",
      addresses: [{
        type: "delivery",
        firstName: (payer === null || payer === void 0 ? void 0 : (_payer$name3 = payer.name) === null || _payer$name3 === void 0 ? void 0 : _payer$name3.given_name) || "",
        middleName: "",
        lastName: (payer === null || payer === void 0 ? void 0 : (_payer$name4 = payer.name) === null || _payer$name4 === void 0 ? void 0 : _payer$name4.surname) || "",
        street: address === null || address === void 0 ? void 0 : address.address_line_1,
        street2: "",
        postalCode: (address === null || address === void 0 ? void 0 : address.postal_code) || "",
        city: (address === null || address === void 0 ? void 0 : address.admin_area_2) || "",
        state: (address === null || address === void 0 ? void 0 : address.admin_area_1) || "",
        country: (address === null || address === void 0 ? void 0 : address.country_code) || "",
        phone: "",
        email: (payer === null || payer === void 0 ? void 0 : payer.email_address) || ""
      }]
    }
  };
}

module.exports = toCrystallizeOrderModel;

/***/ }),

/***/ "./src/services/payment-providers/stripe/confirm-order.js":
/*!****************************************************************!*\
  !*** ./src/services/payment-providers/stripe/confirm-order.js ***!
  \****************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = async function confirmOrder({
  paymentIntentId,
  checkoutModel,
  context
}) {
  var _checkoutModel$custom, _checkoutModel$custom2, _checkoutModel$custom3;

  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const toCrystallizeOrderModel = __webpack_require__(/*! ./to-crystallize-order-model */ "./src/services/payment-providers/stripe/to-crystallize-order-model.js");

  const {
    basketModel
  } = checkoutModel;
  const {
    user
  } = context;
  const basket = await basketService.get({
    basketModel,
    context
  }); // Prepare a valid model for Crystallize order intake

  const crystallizeOrderModel = await toCrystallizeOrderModel({
    basket,
    checkoutModel,
    paymentIntentId,
    customerIdentifier: (user === null || user === void 0 ? void 0 : user.email) || (checkoutModel === null || checkoutModel === void 0 ? void 0 : (_checkoutModel$custom = checkoutModel.customer) === null || _checkoutModel$custom === void 0 ? void 0 : (_checkoutModel$custom2 = _checkoutModel$custom.addresses) === null || _checkoutModel$custom2 === void 0 ? void 0 : (_checkoutModel$custom3 = _checkoutModel$custom2[0]) === null || _checkoutModel$custom3 === void 0 ? void 0 : _checkoutModel$custom3.email) || ""
  });
  /**
   * Record the order in Crystallize
   * Manage the order lifecycle by using the fulfilment pipelines:
   * https://crystallize.com/learn/user-guides/orders-and-fulfilment
   */

  const order = await crystallize.orders.create(crystallizeOrderModel);
  return {
    success: true,
    orderId: order.id
  };
};

/***/ }),

/***/ "./src/services/payment-providers/stripe/create-payment-intent.js":
/*!************************************************************************!*\
  !*** ./src/services/payment-providers/stripe/create-payment-intent.js ***!
  \************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = async function createPaymentIntent({
  checkoutModel,
  confirm = false,
  paymentMethodId,
  context
}) {
  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/stripe/utils.js");

  const {
    basketModel
  } = checkoutModel;
  const basket = await basketService.get({
    basketModel,
    context
  });
  const paymentIntent = await getClient().paymentIntents.create({
    amount: basket.total.gross * 100,
    currency: basket.total.currency,
    confirm,
    payment_method: paymentMethodId
  });
  return paymentIntent;
};

/***/ }),

/***/ "./src/services/payment-providers/stripe/index.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/stripe/index.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const createPaymentIntent = __webpack_require__(/*! ./create-payment-intent */ "./src/services/payment-providers/stripe/create-payment-intent.js");

const confirmOrder = __webpack_require__(/*! ./confirm-order */ "./src/services/payment-providers/stripe/confirm-order.js");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY;
module.exports = {
  enabled: Boolean(STRIPE_SECRET_KEY && STRIPE_PUBLISHABLE_KEY),
  // The required frontend config
  frontendConfig: {
    publishableKey: STRIPE_PUBLISHABLE_KEY
  },
  createPaymentIntent,
  confirmOrder
};

/***/ }),

/***/ "./src/services/payment-providers/stripe/to-crystallize-order-model.js":
/*!*****************************************************************************!*\
  !*** ./src/services/payment-providers/stripe/to-crystallize-order-model.js ***!
  \*****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = async function stripeToCrystallizeOrderModel({
  basket,
  checkoutModel,
  paymentIntentId,
  customerIdentifier
}) {
  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/stripe/utils.js");

  const paymentIntent = await getClient().paymentIntents.retrieve(paymentIntentId);
  const {
    data
  } = paymentIntent.charges;
  const charge = data[0];
  const customerName = charge.billing_details.name.split(" ");
  let email = charge.receipt_email;

  if (!email && checkoutModel.customer && checkoutModel.customer.addresses) {
    const addressWithEmail = checkoutModel.customer.addresses.find(a => !!a.email);

    if (addressWithEmail) {
      email = addressWithEmail.email;
    }
  }

  const meta = [];

  if (paymentIntent.merchant_data) {
    meta.push({
      key: "stripeMerchantData",
      value: JSON.stringify(paymentIntent.merchant_data)
    });
  }

  return {
    cart: basket.cart,
    total: basket.total,
    meta,
    customer: {
      identifier: customerIdentifier,
      firstName: customerName[0],
      middleName: customerName.slice(1, customerName.length - 1).join(),
      lastName: customerName[customerName.length - 1],
      birthDate: Date,
      addresses: [{
        type: "billing",
        firstName: customerName[0],
        middleName: customerName.slice(1, customerName.length - 1).join(),
        lastName: customerName[customerName.length - 1],
        street: charge.billing_details.address.line1,
        street2: charge.billing_details.address.line2,
        postalCode: charge.billing_details.address.postal_code,
        city: charge.billing_details.address.city,
        state: charge.billing_details.address.state,
        country: charge.billing_details.address.country,
        phone: charge.billing_details.phone,
        email
      }, {
        type: "delivery",
        firstName: customerName[0],
        middleName: customerName.slice(1, customerName.length - 1).join(),
        lastName: customerName[customerName.length - 1],
        street: charge.billing_details.address.line1,
        street2: charge.billing_details.address.line2,
        postalCode: charge.billing_details.address.postal_code,
        city: charge.billing_details.address.city,
        state: charge.billing_details.address.state,
        country: charge.billing_details.address.country,
        phone: charge.billing_details.phone,
        email
      }]
    },
    payment: [{
      provider: "stripe",
      stripe: {
        stripe: charge.id,
        customerId: charge.customer,
        orderId: charge.payment_intent,
        paymentMethod: charge.payment_method_details.type,
        paymentMethodId: charge.payment_method,
        paymentIntentId: charge.payment_intent,
        subscriptionId: charge.subscription,
        metadata: ""
      }
    }]
  };
};

/***/ }),

/***/ "./src/services/payment-providers/stripe/utils.js":
/*!********************************************************!*\
  !*** ./src/services/payment-providers/stripe/utils.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const invariant = __webpack_require__(/*! invariant */ "invariant");

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
let client;
module.exports = {
  getClient: () => {
    invariant(STRIPE_SECRET_KEY, "process.env.STRIPE_SECRET_KEY is not defined");

    if (!client) {
      const stripeSdk = __webpack_require__(/*! stripe */ "stripe");

      client = stripeSdk(STRIPE_SECRET_KEY);
    }

    return client;
  }
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/fallback.js":
/*!**********************************************************!*\
  !*** ./src/services/payment-providers/vipps/fallback.js ***!
  \**********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = async function vippsFallback({
  crystallizeOrderId,
  onSuccessURL,
  onErrorURL
}) {
  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/vipps/utils.js");

  let redirectTo = "";
  const vippsClient = await getClient(); // Retrieve the Vipps order to get transaction details

  const order = await vippsClient.getOrderDetails({
    orderId: crystallizeOrderId
  });
  const [lastTransactionLogEntry] = order.transactionLogHistory.sort((a, b) => new Date(b.timeStamp) - new Date(a.timeStamp));
  /**
   * If the transaction logs last entry has status
   * RESERVE, then the amount has been successfully
   * reserved on the user account, and we can show
   * the confirmation page
   */

  if (lastTransactionLogEntry.operation === "RESERVE" && lastTransactionLogEntry.operationSuccess) {
    redirectTo = onSuccessURL;
    /**
     * At this point we have user details from Vipps, which
     * makes it a good time to update the Crystallize order
     */

    const {
      userDetails: {
        userId,
        firstName,
        lastName,
        email,
        mobileNumber: phone
      } = {},
      shippingDetails: {
        address: {
          addressLine1: street,
          addressLine2: street2,
          postCode: postalCode,
          city,
          country
        } = {}
      } = {}
    } = order;
    await crystallize.orders.update(crystallizeOrderId, {
      payment: [{
        provider: "custom",
        custom: {
          properties: [{
            property: "PaymentProvider",
            value: "Vipps"
          }, {
            property: "Vipps orderId",
            value: crystallizeOrderId
          }, {
            property: "Vipps userId",
            value: userId
          }]
        }
      }],
      customer: {
        identifier: email,
        firstName,
        lastName,
        addresses: [{
          type: "delivery",
          email,
          firstName,
          lastName,
          phone,
          street,
          street2,
          postalCode,
          city,
          country
        }]
      }
    });
  } else {
    redirectTo = onErrorURL;
    console.log(JSON.stringify(lastTransactionLogEntry, null, 2));
  }

  return {
    redirectTo
  };
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/index.js":
/*!*******************************************************!*\
  !*** ./src/services/payment-providers/vipps/index.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Vipps (https://vipps.no)
 *
 * Getting started:
 * https://crystallize.com/learn/open-source/payment-gateways/vipps
 */
const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET;
const VIPPS_MERCHANT_SERIAL = process.env.VIPPS_MERCHANT_SERIAL;
const VIPPS_SUB_KEY = process.env.VIPPS_SUB_KEY;

const initiatePayment = __webpack_require__(/*! ./initiate-payment */ "./src/services/payment-providers/vipps/initiate-payment.js");

const fallback = __webpack_require__(/*! ./fallback */ "./src/services/payment-providers/vipps/fallback.js");

const orderUpdate = __webpack_require__(/*! ./order-update */ "./src/services/payment-providers/vipps/order-update.js");

const userConsentRemoval = __webpack_require__(/*! ./user-consent-removal */ "./src/services/payment-providers/vipps/user-consent-removal.js");

module.exports = {
  enabled: Boolean(VIPPS_CLIENT_ID && VIPPS_CLIENT_SECRET && VIPPS_MERCHANT_SERIAL && VIPPS_SUB_KEY),
  frontendConfig: {},
  initiatePayment,
  fallback,
  orderUpdate,
  userConsentRemoval
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/initiate-payment.js":
/*!******************************************************************!*\
  !*** ./src/services/payment-providers/vipps/initiate-payment.js ***!
  \******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const invariant = __webpack_require__(/*! invariant */ "invariant");

const VIPPS_MERCHANT_SERIAL = process.env.VIPPS_MERCHANT_SERIAL;

module.exports = async function initiateVippsPayment({
  checkoutModel,
  context
}) {
  const basketService = __webpack_require__(/*! ../../basket-service */ "./src/services/basket-service/index.js");

  const crystallize = __webpack_require__(/*! ../../crystallize */ "./src/services/crystallize/index.js");

  const {
    getClient
  } = __webpack_require__(/*! ./utils */ "./src/services/payment-providers/vipps/utils.js");

  invariant(VIPPS_MERCHANT_SERIAL, "process.env.VIPPS_MERCHANT_SERIAL is undefined");
  const {
    basketModel,
    customer,
    confirmationURL,
    checkoutURL
  } = checkoutModel;
  const {
    serviceCallbackHost,
    user
  } = context; // Add the identifier from the current logged in user

  const customerWithCurrentLoggedInUser = _objectSpread({}, customer);

  if (user) {
    customerWithCurrentLoggedInUser.identifier = user.email;
  }

  const basket = await basketService.get({
    basketModel,
    context
  });
  const {
    total
  } = basket;
  /* Use a Crystallize order and the fulfilment pipelines to
   * manage the lifecycle of the order
   */

  const crystallizeOrder = await crystallize.orders.create(_objectSpread(_objectSpread({}, basket), {}, {
    customer: customerWithCurrentLoggedInUser
  }));
  const crystallizeOrderId = crystallizeOrder.id;
  /**
   * The Vipps "fallback" url, is where the user will be redirected
   * to after completing the Vipps checkout.
   */

  const fallBackURL = new URL(`${serviceCallbackHost}/webhooks/payment-providers/vipps/fallback/${crystallizeOrderId}`);
  fallBackURL.searchParams.append("confirmation", encodeURIComponent(confirmationURL.replace("{crystallizeOrderId}", crystallizeOrderId)));
  fallBackURL.searchParams.append("checkout", encodeURIComponent(checkoutURL));
  const vippsClient = await getClient();
  const vippsResponse = await vippsClient.initiatePayment({
    order: {
      merchantInfo: {
        merchantSerialNumber: VIPPS_MERCHANT_SERIAL,
        fallBack: fallBackURL.toString(),
        callbackPrefix: `${serviceCallbackHost}/webhooks/payment-providers/vipps/order-update`,
        shippingDetailsPrefix: `${serviceCallbackHost}/webhooks/payment-providers/vipps/shipping`,
        consentRemovalPrefix: `${serviceCallbackHost}/webhooks/payment-providers/vipps/constent-removal`,
        paymentType: "eComm Express Payment",
        isApp: false,
        staticShippingDetails: [// Provide a default shipping method
        {
          isDefault: "Y",
          priority: 0,
          shippingCost: 0,
          shippingMethod: "Posten Servicepakke",
          shippingMethodId: "posten-servicepakke"
        }]
      },
      customerInfo: {},
      transaction: {
        orderId: crystallizeOrderId,
        amount: parseInt(total.gross * 100, 10),
        transactionText: "Crystallize test transaction"
      }
    }
  });
  return {
    success: true,
    checkoutLink: vippsResponse.url,
    crystallizeOrderId
  };
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/order-update.js":
/*!**************************************************************!*\
  !*** ./src/services/payment-providers/vipps/order-update.js ***!
  \**************************************************************/
/***/ ((module) => {

module.exports = async function vippsOrderUpdate({
  crystallizeOrderId
}) {
  console.log("VIPPS order update");
  console.log({
    crystallizeOrderId
  }); // const { getClient } = require("./utils");
  // const vippsClient = await getClient();
  // Retrieve the Vipps order transaction details
  // const order = await vippsClient.getOrderDetails({
  //   orderId: crystallizeOrderId,
  // });
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/user-consent-removal.js":
/*!**********************************************************************!*\
  !*** ./src/services/payment-providers/vipps/user-consent-removal.js ***!
  \**********************************************************************/
/***/ ((module) => {

module.exports = async function vippsUserConsentRemoval({
  vippsUserId
}) {
  // const { getClient } = require("./utils");
  // const vippsClient = await getClient();
  console.log("VIPPS user consent removal");
  console.log({
    vippsUserId
  });
};

/***/ }),

/***/ "./src/services/payment-providers/vipps/utils.js":
/*!*******************************************************!*\
  !*** ./src/services/payment-providers/vipps/utils.js ***!
  \*******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const invariant = __webpack_require__(/*! invariant */ "invariant");

const VIPPS_CLIENT_ID = process.env.VIPPS_CLIENT_ID;
const VIPPS_CLIENT_SECRET = process.env.VIPPS_CLIENT_SECRET;
const VIPPS_SUB_KEY = process.env.VIPPS_SUB_KEY;
let client;
module.exports = {
  getClient: () => {
    invariant(VIPPS_CLIENT_ID, "process.env.VIPPS_CLIENT_ID is not defined");
    invariant(VIPPS_CLIENT_SECRET, "process.env.VIPPS_CLIENT_SECRET is not defined");
    invariant(VIPPS_SUB_KEY, "process.env.VIPPS_SUB_KEY is not defined");

    if (!client) {
      const VippsClient = __webpack_require__(/*! @crystallize/node-vipps */ "@crystallize/node-vipps");

      client = new VippsClient({
        testDrive: true,
        id: VIPPS_CLIENT_ID,
        secret: VIPPS_CLIENT_SECRET,
        subscriptionId: VIPPS_SUB_KEY
      });
    }

    return client;
  }
};

/***/ }),

/***/ "./src/services/user-service/index.js":
/*!********************************************!*\
  !*** ./src/services/user-service/index.js ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const invariant = __webpack_require__(/*! invariant */ "invariant");

const crystallize = __webpack_require__(/*! ../crystallize */ "./src/services/crystallize/index.js");
/**
 * Todo: link to good JWT intro
 */


const JWT_SECRET = process.env.JWT_SECRET; // Cookie config for user JWTs

const COOKIE_USER_TOKEN_NAME = "user-token";
const COOKIE_USER_TOKEN_MAX_AGE = 60 * 60 * 24;
const COOKIE_REFRESH_TOKEN_NAME = "user-token-refresh";
const COOKIE_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

async function getUser({
  context
}) {
  const userInContext = context.user;
  const user = {
    isLoggedIn: Boolean(userInContext && "email" in userInContext),
    email: userInContext && userInContext.email,
    logoutLink: `${context.publicHost}/user/logout`
  };

  if (user && user.isLoggedIn) {
    const crystallizeCustomer = await crystallize.customers.get({
      identifier: user.email
    });

    if (crystallizeCustomer) {
      Object.assign(user, crystallizeCustomer);
    }
  }

  return user;
}

module.exports = {
  COOKIE_USER_TOKEN_NAME,
  COOKIE_REFRESH_TOKEN_NAME,
  COOKIE_USER_TOKEN_MAX_AGE,
  COOKIE_REFRESH_TOKEN_MAX_AGE,

  authenticate(token) {
    invariant(JWT_SECRET, "process.env.JWT_SECRET is not defined");

    if (!token) {
      return null;
    }

    try {
      const jwt = __webpack_require__(/*! jsonwebtoken */ "jsonwebtoken");

      const decoded = jwt.verify(token, JWT_SECRET);

      if (!decoded) {
        return null;
      }

      return {
        email: decoded.email
      };
    } catch (e) {
      return null;
    }
  },

  async sendMagicLink({
    email,
    redirectURLAfterLogin,
    context
  }) {
    invariant(JWT_SECRET, "process.env.JWT_SECRET is not defined");
    const {
      publicHost
    } = context;
    const crystallizeCustomer = await crystallize.customers.get({
      identifier: email
    });
    /**
     * If there is no customer record in Crystallize, we will
     * create one.
     *
     * You can choose NOT to create a customer at this point,
     * and prohibit logins for none customers
     */

    if (!crystallizeCustomer) {
      // return {
      //   success: false,
      //   error: "CUSTOMER_NOT_FOUND",
      // };
      const emailParts = email.split("@");
      await crystallize.customers.create({
        identifier: email,
        firstName: emailParts[0],
        lastName: emailParts[1]
      });
    }
    /**
     * This is the page responsible of receiving the magic
     * link token, and then calling the validateMagicLinkToken
     * function from userService.
     */


    const loginLink = new URL(`${publicHost}/user/login-magic-link`);
    /**
     * Add the JWT to the callback url
     * When the link is visited, we can validate the token
     * again in the validateMagicLinkToken method
     */

    const jwt = __webpack_require__(/*! jsonwebtoken */ "jsonwebtoken");

    loginLink.searchParams.append("token", jwt.sign({
      email,
      redirectURLAfterLogin
    }, JWT_SECRET, {
      expiresIn: "1h"
    }));

    const emailService = __webpack_require__(/*! ../email-service */ "./src/services/email-service/index.js");

    const {
      success
    } = await emailService.sendUserMagicLink({
      loginLink: loginLink.toString(),
      email
    });
    return {
      success
    };
  },

  validateMagicLinkToken(token) {
    invariant(JWT_SECRET, "process.env.JWT_SECRET is not defined");
    /**
     * Here we would want to fetch an entry matching the provided token from our
     * datastore. This boilerplate does not have a datastore connected to it yet
     * so we will just assume the token is for a real user and sign a login token
     * accordingly.
     */

    try {
      const jwt = __webpack_require__(/*! jsonwebtoken */ "jsonwebtoken");

      const decoded = jwt.verify(token, JWT_SECRET);
      const {
        email,
        redirectURLAfterLogin
      } = decoded;
      const signedLoginToken = jwt.sign({
        email
      }, JWT_SECRET, {
        expiresIn: COOKIE_USER_TOKEN_MAX_AGE
      });
      const signedLoginRefreshToken = jwt.sign({
        email
      }, JWT_SECRET, {
        expiresIn: COOKIE_REFRESH_TOKEN_MAX_AGE
      });
      return {
        success: true,
        signedLoginToken,
        COOKIE_USER_TOKEN_MAX_AGE,
        signedLoginRefreshToken,
        redirectURLAfterLogin,
        COOKIE_REFRESH_TOKEN_MAX_AGE
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        error
      };
    }
  },

  validateRefreshToken({
    refreshToken,
    email
  }) {
    if (!refreshToken || !email) {
      return false;
    }

    try {
      const jwt = __webpack_require__(/*! jsonwebtoken */ "jsonwebtoken");

      const decoded = jwt.verify(refreshToken, JWT_SECRET);

      if (decoded.email === email) {
        return jwt.sign({
          email
        }, JWT_SECRET, {
          expiresIn: COOKIE_USER_TOKEN_MAX_AGE
        });
      }
    } catch (e) {
      console.log(e);
    }

    return false;
  },

  getUser,

  async update({
    context,
    input
  }) {
    const {
      user
    } = context;

    if (!user) {
      throw new Error("No user found in context");
    }

    await crystallize.customers.update({
      identifier: user.email,
      customer: input
    });
    return getUser({
      context
    });
  }

};

/***/ }),

/***/ "./src/services/voucher-service/crystallize-vouchers-example.js":
/*!**********************************************************************!*\
  !*** ./src/services/voucher-service/crystallize-vouchers-example.js ***!
  \**********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  callCatalogueApi
} = __webpack_require__(/*! ../crystallize/utils */ "./src/services/crystallize/utils.js");
/**
 * Example of how to use Crystallize to store and
 * manage vouchers.
 *
 * Expected catalogue structure:
 * _vouchers
 *  - voucher_1
 *  - voucher_2
 *  - ...
 *  - voucher_n
 *
 * Each voucher is based on the following shape
 * code (singleLine)
 * discount (choiceComponent)
 *  - percent (numeric)
 *  - amount (numeric)
 */


module.exports = async function getCrystallizeVouchers() {
  const vouchersFromCrystallize = await callCatalogueApi({
    query: `
      {
        catalogue(language: "en", path: "/vouchers") {
          children {
            name
            code: component(id: "code") {
              content {
                ... on SingleLineContent {
                  text
                }
              }
            }
            discount: component(id: "discount") {
              content {
                ... on ComponentChoiceContent {
                  selectedComponent {
                    id
                    content {
                      ... on NumericContent {
                        number
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `
  });

  if (!vouchersFromCrystallize.data || !vouchersFromCrystallize.data.catalogue) {
    return [];
  }

  return vouchersFromCrystallize.data.catalogue.children.map(voucherFromCrystallize => {
    const discountComponent = voucherFromCrystallize.discount.content.selectedComponent;
    let discountAmount = null;
    let discountPercent = null;

    if (discountComponent.id === "percent") {
      discountPercent = discountComponent.content.number;
    } else {
      discountAmount = discountComponent.content.number;
    }

    return {
      code: voucherFromCrystallize.code.content.text,
      discountAmount,
      discountPercent,
      onlyForAuthorisedUser: false
    };
  });
};

/***/ }),

/***/ "./src/services/voucher-service/index.js":
/*!***********************************************!*\
  !*** ./src/services/voucher-service/index.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const getCrystallizeVouchers = __webpack_require__(/*! ./crystallize-vouchers-example */ "./src/services/voucher-service/crystallize-vouchers-example.js");
/**
 * Example of a voucher register
 * You can customise this to call an external service
 * or keep static vouchers like this
 */


const voucherRegister = [{
  code: "ok-deal",
  discountAmount: 2,
  discountPercent: null,
  onlyForAuthorisedUser: false
}, {
  code: "fair-deal",
  discountAmount: null,
  discountPercent: 5,
  onlyForAuthorisedUser: false
}, {
  code: "awesome-deal-logged-in",
  discountAmount: null,
  discountPercent: 10,
  onlyForAuthorisedUser: true
}, {
  code: "good-deal-logged-in",
  discountAmount: 100,
  discountPercent: null,
  onlyForAuthorisedUser: true
}];
module.exports = {
  async get({
    code,
    context
  }) {
    const {
      user
    } = context;
    const isAnonymousUser = !user || !user.isLoggedIn;
    const allCrystallizeVouchers = await getCrystallizeVouchers();
    const allVouchers = [...voucherRegister, ...allCrystallizeVouchers]; // As default, not all the vouchers work for anonymous users.
    // As you'll see in the configuration above, some need the user to be logged in

    if (isAnonymousUser) {
      const voucher = allVouchers.filter(v => !v.onlyForAuthorisedUser).find(v => v.code === code);
      return {
        isValid: Boolean(voucher),
        voucher
      };
    } // Search all vouchers for authenticated users


    let voucher = allVouchers.find(v => v.code === code);
    return {
      isValid: Boolean(voucher),
      voucher
    };
  }

};

/***/ }),

/***/ "@crystallize/node-klarna":
/*!*******************************************!*\
  !*** external "@crystallize/node-klarna" ***!
  \*******************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@crystallize/node-klarna");

/***/ }),

/***/ "@crystallize/node-vipps":
/*!******************************************!*\
  !*** external "@crystallize/node-vipps" ***!
  \******************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@crystallize/node-vipps");

/***/ }),

/***/ "@mollie/api-client":
/*!*************************************!*\
  !*** external "@mollie/api-client" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@mollie/api-client");

/***/ }),

/***/ "@paypal/checkout-server-sdk":
/*!**********************************************!*\
  !*** external "@paypal/checkout-server-sdk" ***!
  \**********************************************/
/***/ ((module) => {

"use strict";
module.exports = require("@paypal/checkout-server-sdk");

/***/ }),

/***/ "@sendgrid/mail":
/*!*********************************!*\
  !*** external "@sendgrid/mail" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("@sendgrid/mail");

/***/ }),

/***/ "apollo-server-micro":
/*!**************************************!*\
  !*** external "apollo-server-micro" ***!
  \**************************************/
/***/ ((module) => {

"use strict";
module.exports = require("apollo-server-micro");

/***/ }),

/***/ "graphql-tag":
/*!******************************!*\
  !*** external "graphql-tag" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("graphql-tag");

/***/ }),

/***/ "invariant":
/*!****************************!*\
  !*** external "invariant" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("invariant");

/***/ }),

/***/ "jsonwebtoken":
/*!*******************************!*\
  !*** external "jsonwebtoken" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = require("jsonwebtoken");

/***/ }),

/***/ "mjml":
/*!***********************!*\
  !*** external "mjml" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("mjml");

/***/ }),

/***/ "node-fetch":
/*!*****************************!*\
  !*** external "node-fetch" ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node-fetch");

/***/ }),

/***/ "stripe":
/*!*************************!*\
  !*** external "stripe" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stripe");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("./pages/api/graphql.js"));
module.exports = __webpack_exports__;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZXMvYXBpL2dyYXBocWwuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxNQUFNQSxTQUFTLEdBQUlDLEVBQUQsSUFBUSxPQUFPQyxHQUFQLEVBQVlDLEdBQVosS0FBb0I7QUFDNUNBLEVBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjLGtDQUFkLEVBQWtELElBQWxEO0FBQ0FELEVBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUFjLDZCQUFkLEVBQTZDRixHQUFHLENBQUNHLE9BQUosQ0FBWUMsTUFBWixJQUFzQixHQUFuRTtBQUNBSCxFQUFBQSxHQUFHLENBQUNDLFNBQUosQ0FDRSw4QkFERixFQUVFLG1DQUZGO0FBSUFELEVBQUFBLEdBQUcsQ0FBQ0MsU0FBSixDQUNFLDhCQURGLEVBRUUsd0hBRkY7O0FBSUEsTUFBSUYsR0FBRyxDQUFDSyxNQUFKLEtBQWUsU0FBbkIsRUFBOEI7QUFDNUJKLElBQUFBLEdBQUcsQ0FBQ0ssTUFBSixDQUFXLEdBQVgsRUFBZ0JDLEdBQWhCO0FBQ0E7QUFDRDs7QUFDRCxTQUFPLE1BQU1SLEVBQUUsQ0FBQ0MsR0FBRCxFQUFNQyxHQUFOLENBQWY7QUFDRCxDQWhCRDs7QUFrQkEsaUVBQWVILFNBQWY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDbEJBO0FBRUE7QUFFQTtBQUNBO0FBRUEsTUFBTWMsWUFBWSxHQUFHLElBQUlKLDZEQUFKLENBQ25CRSwwREFBeUIsQ0FBQztBQUN4QkcsRUFBQUEsYUFBYSxFQUFFLE1BRFM7O0FBRXhCQyxFQUFBQSxnQkFBZ0IsQ0FBQztBQUFFZCxJQUFBQTtBQUFGLEdBQUQsRUFBVTtBQUN4QixXQUFPQSxHQUFQO0FBQ0QsR0FKdUI7O0FBS3hCZSxFQUFBQSxnQkFBZ0IsQ0FBQztBQUFFZCxJQUFBQTtBQUFGLEdBQUQsRUFBVWUsWUFBVixFQUF3QjtBQUN0Q2YsSUFBQUEsR0FBRyxDQUFDQyxTQUFKLENBQ0UsWUFERixFQUVHLEdBQUVTLDBGQUFtQyxJQUFHSyxZQUFhLHVCQUFzQkwsNkZBQXNDLFVBRnBIO0FBSUQ7O0FBVnVCLENBQUQsQ0FETixDQUFyQjtBQWVPLE1BQU1RLE1BQU0sR0FBRztBQUNwQkMsRUFBQUEsR0FBRyxFQUFFO0FBQ0hDLElBQUFBLFVBQVUsRUFBRTtBQURUO0FBRGUsQ0FBZjtBQU1QLGlFQUFlWixrREFBSSxDQUFDRyxZQUFZLENBQUNVLGFBQWIsQ0FBMkI7QUFBRUMsRUFBQUEsSUFBSSxFQUFFO0FBQVIsQ0FBM0IsQ0FBRCxDQUFuQjs7Ozs7Ozs7OztBQzVCQSxNQUFNWixXQUFXLEdBQUdhLG1CQUFPLENBQUMsc0VBQUQsQ0FBM0I7O0FBQ0EsTUFBTUMsT0FBTyxHQUFHRCxtQkFBTyxDQUFDLDhDQUFELENBQXZCOztBQUVBRSxNQUFNLENBQUNDLE9BQVAsR0FBaUIsU0FBU0MsYUFBVCxDQUF1QjtBQUN0Q2YsRUFBQUEsYUFEc0M7QUFFdENDLEVBQUFBLGdCQUZzQztBQUd0Q0MsRUFBQUE7QUFIc0MsQ0FBdkIsRUFJZDtBQUNELFNBQU8sU0FBU2MsT0FBVCxDQUFpQkMsSUFBakIsRUFBdUI7QUFDNUIsVUFBTTtBQUFFQyxNQUFBQSxPQUFGO0FBQVc1QixNQUFBQTtBQUFYLFFBQXVCVyxnQkFBZ0IsQ0FBQ2dCLElBQUQsQ0FBN0M7QUFFQSxVQUFNRSxJQUFJLEdBQUdyQixXQUFXLENBQUNzQixZQUFaLENBQ1hGLE9BQU8sQ0FBQ3BCLFdBQVcsQ0FBQ00sc0JBQWIsQ0FESSxDQUFiLENBSDRCLENBTzVCOztBQUNBLFFBQUllLElBQUksSUFBSWpCLGdCQUFaLEVBQThCO0FBQzVCLFlBQU1DLFlBQVksR0FBR0wsV0FBVyxDQUFDdUIsb0JBQVosQ0FBaUM7QUFDcERDLFFBQUFBLFlBQVksRUFBRUosT0FBTyxDQUFDcEIsV0FBVyxDQUFDeUIseUJBQWIsQ0FEK0I7QUFFcERDLFFBQUFBLEtBQUssRUFBRUwsSUFBSSxDQUFDSztBQUZ3QyxPQUFqQyxDQUFyQjs7QUFJQSxVQUFJckIsWUFBSixFQUFrQjtBQUNoQkQsUUFBQUEsZ0JBQWdCLENBQUNlLElBQUQsRUFBT2QsWUFBUCxDQUFoQjtBQUNEO0FBQ0YsS0FoQjJCLENBa0I1Qjs7O0FBQ0EsVUFBTXNCLFVBQVUsR0FBR2IsT0FBTyxDQUFDO0FBQUV0QixNQUFBQTtBQUFGLEtBQUQsQ0FBUCxHQUF1QlUsYUFBMUM7QUFFQTtBQUNKO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFDSSxRQUFJMEIsbUJBQW1CLEdBQUdDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxxQkFBdEM7O0FBQ0EsUUFBSUgsbUJBQUosRUFBeUI7QUFDdkIsVUFBSSxDQUFDQSxtQkFBbUIsQ0FBQ0ksUUFBcEIsQ0FBNkI5QixhQUE3QixDQUFMLEVBQWtEO0FBQ2hEMEIsUUFBQUEsbUJBQW1CLElBQUkxQixhQUF2QjtBQUNEO0FBQ0YsS0FKRCxNQUlPO0FBQ0wwQixNQUFBQSxtQkFBbUIsR0FBR0QsVUFBdEI7QUFDRDs7QUFFRCxXQUFPO0FBQ0xOLE1BQUFBLElBREs7QUFFTE0sTUFBQUEsVUFGSztBQUdMQyxNQUFBQTtBQUhLLEtBQVA7QUFLRCxHQWhERDtBQWlERCxDQXRERDs7Ozs7Ozs7OztBQ0hBLE1BQU1YLGFBQWEsR0FBR0osbUJBQU8sQ0FBQyxnRUFBRCxDQUE3Qjs7QUFDQSxNQUFNb0IsU0FBUyxHQUFHcEIsbUJBQU8sQ0FBQyxzREFBRCxDQUF6Qjs7QUFDQSxNQUFNcUIsUUFBUSxHQUFHckIsbUJBQU8sQ0FBQyxzREFBRCxDQUF4Qjs7QUFFQUUsTUFBTSxDQUFDQyxPQUFQLEdBQWlCLFNBQVNtQix5QkFBVCxDQUFtQztBQUNsRGpDLEVBQUFBLGFBQWEsR0FBRyxFQURrQztBQUVsREUsRUFBQUEsZ0JBRmtEO0FBR2xERCxFQUFBQTtBQUhrRCxDQUFuQyxFQUlkO0FBQ0QsUUFBTWUsT0FBTyxHQUFHRCxhQUFhLENBQUM7QUFDNUJmLElBQUFBLGFBRDRCO0FBRTVCRSxJQUFBQSxnQkFGNEI7QUFHNUJELElBQUFBO0FBSDRCLEdBQUQsQ0FBN0I7QUFNQSxTQUFPO0FBQ0xlLElBQUFBLE9BREs7QUFFTGUsSUFBQUEsU0FGSztBQUdMQyxJQUFBQSxRQUhLO0FBSUxFLElBQUFBLGFBQWEsRUFBRSxJQUpWO0FBS0xDLElBQUFBLFVBQVUsRUFBRTtBQUNWQyxNQUFBQSxRQUFRLEVBQUVwQixPQUFPLENBQUNTLFVBRFI7QUFFVlksTUFBQUEsUUFBUSxFQUFFO0FBQ1IsK0JBQXVCO0FBRGY7QUFGQSxLQUxQO0FBV0w7QUFDQUMsSUFBQUEsYUFBYSxFQUFFO0FBWlYsR0FBUDtBQWNELENBekJEOzs7Ozs7Ozs7Ozs7Ozs7O0FDSkEsTUFBTUMsV0FBVyxHQUFHNUIsbUJBQU8sQ0FBQyxvRUFBRCxDQUEzQjs7QUFFQSxNQUFNNkIsYUFBYSxHQUFHN0IsbUJBQU8sQ0FBQywwRUFBRCxDQUE3Qjs7QUFDQSxNQUFNYixXQUFXLEdBQUdhLG1CQUFPLENBQUMsc0VBQUQsQ0FBM0I7O0FBQ0EsTUFBTThCLGNBQWMsR0FBRzlCLG1CQUFPLENBQUMsNEVBQUQsQ0FBOUI7O0FBRUEsTUFBTStCLGFBQWEsR0FBRy9CLG1CQUFPLENBQUMsOEZBQUQsQ0FBN0I7O0FBQ0EsTUFBTWdDLGFBQWEsR0FBR2hDLG1CQUFPLENBQUMsOEZBQUQsQ0FBN0I7O0FBQ0EsTUFBTWlDLFlBQVksR0FBR2pDLG1CQUFPLENBQUMsNEZBQUQsQ0FBNUI7O0FBQ0EsTUFBTWtDLGFBQWEsR0FBR2xDLG1CQUFPLENBQUMsOEZBQUQsQ0FBN0I7O0FBQ0EsTUFBTW1DLGFBQWEsR0FBR25DLG1CQUFPLENBQUMsOEZBQUQsQ0FBN0I7O0FBQ0EsTUFBTW9DLGNBQWMsR0FBR3BDLG1CQUFPLENBQUMsZ0dBQUQsQ0FBOUI7O0FBRUEsU0FBU3FDLHVCQUFULENBQWlDQyxPQUFqQyxFQUEwQztBQUN4QyxTQUFPLE1BQU07QUFDWCxXQUFPO0FBQ0xDLE1BQUFBLE9BQU8sRUFBRUQsT0FBTyxDQUFDQyxPQURaO0FBRUw1QyxNQUFBQSxNQUFNLEVBQUUyQyxPQUFPLENBQUNFO0FBRlgsS0FBUDtBQUlELEdBTEQ7QUFNRDs7QUFFRHRDLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmc0MsRUFBQUEsS0FBSyxFQUFFO0FBQ0xDLElBQUFBLHFCQUFxQixFQUFFLE9BQU87QUFDNUJDLE1BQUFBLFVBQVUsRUFDUjtBQUYwQixLQUFQLENBRGxCO0FBS0xDLElBQUFBLE1BQU0sRUFBRSxDQUFDQyxNQUFELEVBQVN2QyxJQUFULEVBQWVELE9BQWYsS0FBMkJ3QixhQUFhLENBQUNpQixHQUFkLGlDQUF1QnhDLElBQXZCO0FBQTZCRCxNQUFBQTtBQUE3QixPQUw5QjtBQU1MRyxJQUFBQSxJQUFJLEVBQUUsQ0FBQ3FDLE1BQUQsRUFBU3ZDLElBQVQsRUFBZUQsT0FBZixLQUEyQmxCLFdBQVcsQ0FBQzRELE9BQVosQ0FBb0I7QUFBRTFDLE1BQUFBO0FBQUYsS0FBcEIsQ0FONUI7QUFPTDJDLElBQUFBLE1BQU0sRUFBRSxPQUFPLEVBQVAsQ0FQSDtBQVFMQyxJQUFBQSxnQkFBZ0IsRUFBRSxPQUFPLEVBQVAsQ0FSYjtBQVNMQyxJQUFBQSxPQUFPLEVBQUUsQ0FBQ0wsTUFBRCxFQUFTdkMsSUFBVCxFQUFlRCxPQUFmLEtBQ1B5QixjQUFjLENBQUNnQixHQUFmLGlDQUF3QnhDLElBQXhCO0FBQThCRCxNQUFBQTtBQUE5QjtBQVZHLEdBRFE7QUFhZjhDLEVBQUFBLHdCQUF3QixFQUFFO0FBQ3hCQyxJQUFBQSxnQkFBZ0IsR0FBRztBQUNqQkMsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVkseUJBQVo7QUFDQSxhQUFPQyxRQUFRLENBQUNDLElBQUksQ0FBQ0MsTUFBTCxLQUFnQixHQUFqQixDQUFmO0FBQ0Q7O0FBSnVCLEdBYlg7QUFtQmZDLEVBQUFBLHVCQUF1QixFQUFFO0FBQ3ZCQyxJQUFBQSxNQUFNLEVBQUV0Qix1QkFBdUIsQ0FBQ04sYUFBRCxDQURSO0FBRXZCNkIsSUFBQUEsTUFBTSxFQUFFdkIsdUJBQXVCLENBQUNILGFBQUQsQ0FGUjtBQUd2QjJCLElBQUFBLEtBQUssRUFBRXhCLHVCQUF1QixDQUFDSixZQUFELENBSFA7QUFJdkI2QixJQUFBQSxNQUFNLEVBQUV6Qix1QkFBdUIsQ0FBQ0wsYUFBRCxDQUpSO0FBS3ZCK0IsSUFBQUEsTUFBTSxFQUFFMUIsdUJBQXVCLENBQUNGLGFBQUQsQ0FMUjtBQU12QjZCLElBQUFBLE9BQU8sRUFBRTNCLHVCQUF1QixDQUFDRCxjQUFEO0FBTlQsR0FuQlY7QUEyQmY2QixFQUFBQSxZQUFZLEVBQUU7QUFDWm5CLElBQUFBLEdBQUcsRUFBRSxDQUFDRCxNQUFELEVBQVN2QyxJQUFULEtBQWtCc0IsV0FBVyxDQUFDb0IsTUFBWixDQUFtQkYsR0FBbkIsQ0FBdUJ4QyxJQUFJLENBQUM0RCxFQUE1QjtBQURYLEdBM0JDO0FBOEJmQyxFQUFBQSxRQUFRLEVBQUU7QUFDUjNELElBQUFBLElBQUksRUFBRSxPQUFPLEVBQVAsQ0FERTtBQUVSeUMsSUFBQUEsZ0JBQWdCLEVBQUUsT0FBTyxFQUFQO0FBRlYsR0E5Qks7QUFrQ2ZtQixFQUFBQSxhQUFhLEVBQUU7QUFDYkMsSUFBQUEsYUFBYSxFQUFFLENBQUN4QixNQUFELEVBQVN2QyxJQUFULEVBQWVELE9BQWYsS0FDYmxCLFdBQVcsQ0FBQ2tGLGFBQVosaUNBQStCL0QsSUFBL0I7QUFBcUNELE1BQUFBO0FBQXJDLE9BRlc7QUFHYmlFLElBQUFBLE1BQU0sRUFBRSxDQUFDekIsTUFBRCxFQUFTdkMsSUFBVCxFQUFlRCxPQUFmLEtBQTJCbEIsV0FBVyxDQUFDbUYsTUFBWixpQ0FBd0JoRSxJQUF4QjtBQUE4QkQsTUFBQUE7QUFBOUI7QUFIdEIsR0FsQ0E7QUF1Q2ZrRSxFQUFBQSx5QkFBeUIsRUFBRTtBQUN6QlosSUFBQUEsTUFBTSxFQUFFLE9BQU8sRUFBUCxDQURpQjtBQUV6QkMsSUFBQUEsTUFBTSxFQUFFLE9BQU8sRUFBUCxDQUZpQjtBQUd6QkUsSUFBQUEsTUFBTSxFQUFFLE9BQU8sRUFBUCxDQUhpQjtBQUl6QkQsSUFBQUEsS0FBSyxFQUFFLE9BQU8sRUFBUCxDQUprQjtBQUt6QkUsSUFBQUEsTUFBTSxFQUFFLE9BQU8sRUFBUCxDQUxpQjtBQU16QkMsSUFBQUEsT0FBTyxFQUFFLE9BQU8sRUFBUDtBQU5nQixHQXZDWjtBQStDZlEsRUFBQUEsZUFBZSxFQUFFO0FBQ2ZDLElBQUFBLG1CQUFtQixFQUFFLENBQUM1QixNQUFELEVBQVN2QyxJQUFULEVBQWVELE9BQWYsS0FDbkIwQixhQUFhLENBQUMwQyxtQkFBZCxpQ0FBdUNuRSxJQUF2QztBQUE2Q0QsTUFBQUE7QUFBN0MsT0FGYTtBQUdmcUUsSUFBQUEsWUFBWSxFQUFFLENBQUM3QixNQUFELEVBQVN2QyxJQUFULEVBQWVELE9BQWYsS0FDWjBCLGFBQWEsQ0FBQzJDLFlBQWQsaUNBQWdDcEUsSUFBaEM7QUFBc0NELE1BQUFBO0FBQXRDO0FBSmEsR0EvQ0Y7QUFxRGZzRSxFQUFBQSxlQUFlLEVBQUU7QUFDZkMsSUFBQUEsY0FBYyxFQUFFLENBQUMvQixNQUFELEVBQVN2QyxJQUFULEVBQWVELE9BQWYsS0FDZDZCLGFBQWEsQ0FBQzBDLGNBQWQsaUNBQ0t0RSxJQURMO0FBRUVELE1BQUFBO0FBRkY7QUFGYSxHQXJERjtBQTREZndFLEVBQUFBLGVBQWUsRUFBRTtBQUNmQyxJQUFBQSxhQUFhLEVBQUUsQ0FBQ2pDLE1BQUQsRUFBU3ZDLElBQVQsRUFBZUQsT0FBZixLQUNiMkIsYUFBYSxDQUFDOEMsYUFBZCxpQ0FDS3hFLElBREw7QUFFRUQsTUFBQUE7QUFGRjtBQUZhLEdBNURGO0FBbUVmMEUsRUFBQUEsY0FBYyxFQUFFO0FBQ2RDLElBQUFBLGVBQWUsRUFBRSxDQUFDbkMsTUFBRCxFQUFTdkMsSUFBVCxFQUFlRCxPQUFmLEtBQ2Y0QixZQUFZLENBQUMrQyxlQUFiLGlDQUNLMUUsSUFETDtBQUVFRCxNQUFBQTtBQUZGO0FBRlksR0FuRUQ7QUEwRWY0RSxFQUFBQSxjQUFjLEVBQUU7QUFDZEgsSUFBQUEsYUFBYSxFQUFFLENBQUNqQyxNQUFELEVBQVN2QyxJQUFULEVBQWVELE9BQWYsS0FDYjhCLGFBQWEsQ0FBQytDLG1CQUFkLGlDQUNLNUUsSUFETDtBQUVFRCxNQUFBQSxPQUZGO0FBR0V3QyxNQUFBQTtBQUhGLE9BRlk7QUFPZHNDLElBQUFBLGNBQWMsRUFBRSxDQUFDdEMsTUFBRCxFQUFTdkMsSUFBVCxFQUFlRCxPQUFmLEtBQ2Q4QixhQUFhLENBQUNpRCxvQkFBZCxpQ0FDSzlFLElBREw7QUFFRUQsTUFBQUEsT0FGRjtBQUdFd0MsTUFBQUE7QUFIRjtBQVJZLEdBMUVEO0FBd0Zmd0MsRUFBQUEsZUFBZSxFQUFFO0FBQ2ZDLElBQUFBLGFBQWEsRUFBRSxDQUFDekMsTUFBRCxFQUFTdkMsSUFBVCxFQUFlRCxPQUFmLEtBQ2IrQixjQUFjLENBQUNtRCxzQkFBZixpQ0FDS2pGLElBREw7QUFFRUQsTUFBQUEsT0FGRjtBQUdFd0MsTUFBQUE7QUFIRjtBQUZhO0FBeEZGLENBQWpCOzs7Ozs7Ozs7O0FDdEJBLE1BQU0yQyxHQUFHLEdBQUd4RixtQkFBTyxDQUFDLGdDQUFELENBQW5COztBQUVBRSxNQUFNLENBQUNDLE9BQVAsR0FBaUJxRixHQUFJO0FBQ3JCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0EvUkE7Ozs7Ozs7Ozs7QUNGQSxTQUFTQyxjQUFULENBQXdCO0FBQUVDLEVBQUFBLE1BQUY7QUFBVUMsRUFBQUE7QUFBVixDQUF4QixFQUE4QztBQUM1QyxTQUFPLElBQUlDLElBQUksQ0FBQ0MsWUFBVCxDQUFzQixPQUF0QixFQUErQjtBQUFFQyxJQUFBQSxLQUFLLEVBQUUsVUFBVDtBQUFxQkgsSUFBQUE7QUFBckIsR0FBL0IsRUFBZ0VJLE1BQWhFLENBQ0xMLE1BREssQ0FBUDtBQUdEOztBQUVEeEYsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2ZzRixFQUFBQTtBQURlLENBQWpCOzs7Ozs7Ozs7O0FDTkF2RixNQUFNLENBQUNDLE9BQVAsR0FBaUIsU0FBU0YsT0FBVCxDQUFpQjtBQUFFdEIsRUFBQUE7QUFBRixDQUFqQixFQUE4QjtBQUM3QztBQUNBLFFBQU07QUFBRSx5QkFBcUJxSCxTQUF2QjtBQUFrQyx3QkFBb0JDO0FBQXRELE1BQWdFdEgsT0FBdEU7O0FBQ0EsTUFBSXFILFNBQVMsSUFBSUMsS0FBakIsRUFBd0I7QUFDdEIsV0FBUSxHQUFFRCxTQUFVLE1BQUtDLEtBQU0sRUFBL0I7QUFDRDs7QUFFRCxNQUFJakYsT0FBTyxDQUFDQyxHQUFSLENBQVlpRixRQUFoQixFQUEwQjtBQUN4QixXQUFPbEYsT0FBTyxDQUFDQyxHQUFSLENBQVlpRixRQUFuQjtBQUNEOztBQUVELFFBQU07QUFBRUMsSUFBQUEsSUFBRjtBQUFRQyxJQUFBQSxJQUFJLEdBQUdEO0FBQWYsTUFBd0J4SCxPQUE5Qjs7QUFDQSxNQUFJeUgsSUFBSSxJQUFJQSxJQUFJLENBQUNDLFVBQUwsQ0FBZ0IsV0FBaEIsQ0FBWixFQUEwQztBQUN4QyxXQUFRLFVBQVNELElBQUssRUFBdEI7QUFDRCxHQWQ0QyxDQWdCN0M7OztBQUNBLE1BQUlwRixPQUFPLENBQUNDLEdBQVIsQ0FBWXFGLFVBQWhCLEVBQTRCO0FBQzFCLFdBQVEsV0FBVXRGLE9BQU8sQ0FBQ0MsR0FBUixDQUFZcUYsVUFBVyxFQUF6QztBQUNEOztBQUVELE1BQUksQ0FBQ0YsSUFBTCxFQUFXO0FBQ1QsVUFBTSxJQUFJRyxLQUFKLENBQVUsdURBQVYsQ0FBTjtBQUNEOztBQUVELFNBQVEsV0FBVUgsSUFBSyxFQUF2QjtBQUNELENBMUJEOzs7Ozs7Ozs7O0FDQUEsU0FBU0ksd0JBQVQsQ0FBa0NDLGNBQWxDLEVBQWtEQyxnQkFBZ0IsR0FBRyxDQUFyRSxFQUF3RTtBQUN0RTtBQUNBO0FBQ0EsUUFBTUMsZUFBZSxHQUFHRixjQUFjLENBQUNHLE9BQWYsQ0FBdUJGLGdCQUF2QixDQUF4QixDQUhzRSxDQUl0RTs7QUFDQSxTQUFPRyxVQUFVLENBQUNGLGVBQUQsQ0FBakI7QUFDRDs7QUFFRCxTQUFTRyw4QkFBVCxDQUF3QztBQUFFNUQsRUFBQUEsT0FBRjtBQUFXd0MsRUFBQUE7QUFBWCxDQUF4QyxFQUE2RDtBQUMzRDtBQUNBO0FBQ0EsUUFBTXFCLGdCQUFnQixHQUFHQyxPQUFPLENBQUM5RCxPQUFPLENBQUMrRCxjQUFULENBQWhDOztBQUVBLE1BQUlGLGdCQUFKLEVBQXNCO0FBQ3BCLFdBQU83RCxPQUFPLENBQUMrRCxjQUFmO0FBQ0Q7O0FBRUQsUUFBTUMsZ0JBQWdCLEdBQUl4QixNQUFNLEdBQUd4QyxPQUFPLENBQUNpRSxlQUFsQixHQUFxQyxHQUE5RDtBQUVBLFNBQU9YLHdCQUF3QixDQUFDVSxnQkFBRCxDQUEvQjtBQUNEOztBQUVEaEgsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2YyRyxFQUFBQTtBQURlLENBQWpCOzs7Ozs7Ozs7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTU0sWUFBWSxHQUFHLENBQ25CO0FBQ0VDLEVBQUFBLE1BQU0sRUFBRSxJQURWO0FBQ2dCO0FBQ2RDLEVBQUFBLFFBQVEsRUFBRSxDQUNSO0FBQ0VDLElBQUFBLElBQUksRUFBRSxVQURSO0FBRUVDLElBQUFBLE9BQU8sRUFBRTtBQUZYLEdBRFE7QUFGWixDQURtQixDQUFyQjtBQVlBO0FBQ0E7QUFDQTs7QUFDQSxlQUFlQywwQkFBZixDQUEwQztBQUFFQyxFQUFBQSxJQUFGO0FBQVFMLEVBQUFBO0FBQVIsQ0FBMUMsRUFBNEQ7QUFDMUQsTUFBSUssSUFBSSxDQUFDQyxNQUFMLEtBQWdCLENBQXBCLEVBQXVCO0FBQ3JCLFdBQU8sRUFBUDtBQUNEOztBQUVELFFBQU1DLFFBQVEsR0FBR1AsTUFBTSxDQUFDUSw0QkFBeEI7O0FBRUEsUUFBTTtBQUFFQyxJQUFBQSxnQkFBRjtBQUFvQkMsSUFBQUE7QUFBcEIsTUFBc0MvSCxtQkFBTyxDQUFDLGlFQUFELENBQW5EOztBQUVBLFFBQU1nSSxRQUFRLEdBQUcsSUFBSUMsR0FBSixFQUFqQjtBQUNBLE1BQUlDLGlCQUFKOztBQUNBLGlCQUFlQyxpQkFBZixHQUFtQztBQUFBOztBQUNqQyxVQUFNQyxpQkFBaUIsR0FBRyxNQUFNTCxhQUFhLENBQUM7QUFDNUNNLE1BQUFBLEtBQUssRUFBRztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE9BdkJrRDtBQXdCNUNDLE1BQUFBLFNBQVMsRUFBRTtBQUNUWixRQUFBQSxJQURTO0FBRVRhLFFBQUFBLEtBQUssRUFBRUwsaUJBRkU7QUFHVE4sUUFBQUE7QUFIUztBQXhCaUMsS0FBRCxDQUE3QztBQStCQSxVQUFNO0FBQUVZLE1BQUFBLEtBQUY7QUFBU0MsTUFBQUE7QUFBVCxRQUFzQiwwQkFBQUwsaUJBQWlCLENBQUNNLElBQWxCLGdGQUF3QkMsTUFBeEIsS0FBa0MsRUFBOUQ7QUFFQUgsSUFBQUEsS0FBSyxTQUFMLElBQUFBLEtBQUssV0FBTCxZQUFBQSxLQUFLLENBQUVJLE9BQVAsQ0FBZ0JDLElBQUQsSUFBVWIsUUFBUSxDQUFDYyxHQUFULENBQWFELElBQUksQ0FBQ0UsSUFBTCxDQUFVaEosSUFBdkIsQ0FBekI7O0FBRUEsUUFBSTBJLFFBQUosYUFBSUEsUUFBSixlQUFJQSxRQUFRLENBQUVPLFdBQWQsRUFBMkI7QUFDekJkLE1BQUFBLGlCQUFpQixHQUFHTyxRQUFRLENBQUNRLFNBQTdCO0FBQ0EsWUFBTWQsaUJBQWlCLEVBQXZCO0FBQ0Q7QUFDRjs7QUFFRCxRQUFNQSxpQkFBaUIsRUFBdkI7QUFFQTtBQUNGO0FBQ0E7QUFDQTtBQUNBOztBQUNFLFFBQU1lLEtBQUssR0FBR0MsS0FBSyxDQUFDQyxJQUFOLENBQVdwQixRQUFYLENBQWQ7QUFDQSxRQUFNcUIsUUFBUSxHQUFHLE1BQU12QixnQkFBZ0IsQ0FBQztBQUN0Q08sSUFBQUEsS0FBSyxFQUFHO0FBQ1osUUFBUWEsS0FBSyxDQUFDSSxHQUFOLENBQ0EsQ0FBQ3ZKLElBQUQsRUFBT3dKLEtBQVAsS0FBa0I7QUFDMUIsaUJBQWlCQSxLQUFNLHNCQUFxQnhKLElBQUssaUJBQWdCNkgsUUFBUztBQUMxRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsT0FuQ1EsQ0FvQ0E7QUFDUjtBQXZDMEMsR0FBRCxDQUF2QztBQTBDQSxRQUFNNEIseUJBQXlCLEdBQUdwQyxZQUFZLENBQUNxQyxJQUFiLENBQy9CQyxDQUFELElBQU9BLENBQUMsQ0FBQ3JDLE1BQUYsS0FBYUEsTUFBTSxDQUFDQSxNQURLLENBQWxDO0FBSUEsU0FBTzZCLEtBQUssQ0FDVEksR0FESSxDQUNBLENBQUNLLENBQUQsRUFBSUMsQ0FBSixLQUFVUCxRQUFRLENBQUNYLElBQVQsQ0FBZSxVQUFTa0IsQ0FBRSxFQUExQixDQURWLEVBRUpDLE1BRkksQ0FFSUMsQ0FBRCxJQUFPLENBQUMsQ0FBQ0EsQ0FGWixFQUdKUixHQUhJLENBR0EsU0FBU1MsYUFBVCxDQUF1QkMsT0FBdkIsRUFBZ0M7QUFDbkMsVUFBTUMsZUFBZSxHQUFHVCx5QkFBSCxhQUFHQSx5QkFBSCx1QkFBR0EseUJBQXlCLENBQUVsQyxRQUEzQixDQUFvQ21DLElBQXBDLENBQ3JCQyxDQUFELElBQU9BLENBQUMsQ0FBQ25DLElBQUYsS0FBV3lDLE9BQU8sQ0FBQ0UsT0FBUixDQUFnQjNDLElBRFosQ0FBeEI7O0FBR0EsUUFBSTBDLGVBQUosRUFBcUI7QUFDbkJELE1BQUFBLE9BQU8sQ0FBQ0UsT0FBUixHQUFrQkQsZUFBbEI7QUFDRDs7QUFDRCxXQUFPRCxPQUFQO0FBQ0QsR0FYSSxDQUFQO0FBWUQ7O0FBRUQ5SixNQUFNLENBQUNDLE9BQVAsR0FBaUI7QUFDZnNILEVBQUFBO0FBRGUsQ0FBakI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUMvSUE7QUFDQSxTQUFTMEMsU0FBVCxDQUFtQjtBQUFFQyxFQUFBQSxJQUFGO0FBQVFGLEVBQUFBO0FBQVIsQ0FBbkIsRUFBc0M7QUFDcEMsU0FBT0UsSUFBSSxDQUFDQyxNQUFMLENBQ0wsQ0FBQ0MsR0FBRCxFQUFNQyxJQUFOLEtBQWU7QUFDYixVQUFNO0FBQUVDLE1BQUFBLFFBQUY7QUFBWUMsTUFBQUE7QUFBWixRQUFzQkYsSUFBNUI7O0FBQ0EsUUFBSUUsS0FBSixFQUFXO0FBQ1QsWUFBTUMsVUFBVSxHQUFHRCxLQUFLLENBQUNFLFVBQU4sSUFBb0JGLEtBQXZDO0FBQ0FILE1BQUFBLEdBQUcsQ0FBQ00sS0FBSixJQUFhRixVQUFVLENBQUNFLEtBQVgsR0FBbUJKLFFBQWhDO0FBQ0FGLE1BQUFBLEdBQUcsQ0FBQ08sR0FBSixJQUFXSCxVQUFVLENBQUNHLEdBQVgsR0FBaUJMLFFBQTVCO0FBQ0FGLE1BQUFBLEdBQUcsQ0FBQzNFLFFBQUosR0FBZThFLEtBQUssQ0FBQzlFLFFBQXJCO0FBQ0Q7O0FBRUQsV0FBTzJFLEdBQVA7QUFDRCxHQVhJLEVBWUw7QUFBRU0sSUFBQUEsS0FBSyxFQUFFLENBQVQ7QUFBWUMsSUFBQUEsR0FBRyxFQUFFLENBQWpCO0FBQW9CQyxJQUFBQSxHQUFHLEVBQUVaLE9BQXpCO0FBQWtDYSxJQUFBQSxRQUFRLEVBQUUsQ0FBNUM7QUFBK0NwRixJQUFBQSxRQUFRLEVBQUU7QUFBekQsR0FaSyxDQUFQO0FBY0Q7O0FBRUR6RixNQUFNLENBQUNDLE9BQVAsR0FBaUI7QUFDZixRQUFNMkMsR0FBTixDQUFVO0FBQUVrSSxJQUFBQSxXQUFGO0FBQWUzSyxJQUFBQTtBQUFmLEdBQVYsRUFBb0M7QUFDbEMsVUFBTTtBQUFFZ0gsTUFBQUEsTUFBRjtBQUFVNEQsTUFBQUE7QUFBVixRQUErQ0QsV0FBckQ7QUFBQSxVQUFnQ0UsZ0JBQWhDLDRCQUFxREYsV0FBckQ7QUFFQTtBQUNKO0FBQ0E7OztBQUNJLFFBQUk5SCxPQUFKOztBQUNBLFFBQUkrSCxXQUFKLEVBQWlCO0FBQ2YsWUFBTW5KLGNBQWMsR0FBRzlCLG1CQUFPLENBQUMsbUVBQUQsQ0FBOUI7O0FBQ0EsWUFBTXFKLFFBQVEsR0FBRyxNQUFNdkgsY0FBYyxDQUFDZ0IsR0FBZixDQUFtQjtBQUFFcUksUUFBQUEsSUFBSSxFQUFFRixXQUFSO0FBQXFCNUssUUFBQUE7QUFBckIsT0FBbkIsQ0FBdkI7O0FBRUEsVUFBSWdKLFFBQVEsQ0FBQytCLE9BQWIsRUFBc0I7QUFDcEJsSSxRQUFBQSxPQUFPLEdBQUdtRyxRQUFRLENBQUNuRyxPQUFuQjtBQUNEO0FBQ0Y7QUFFRDtBQUNKO0FBQ0E7OztBQUNJLFVBQU07QUFDSnVFLE1BQUFBO0FBREksUUFFRnpILG1CQUFPLENBQUMsdUdBQUQsQ0FGWDs7QUFHQSxVQUFNcUwsMEJBQTBCLEdBQUcsTUFBTTVELDBCQUEwQixDQUFDO0FBQ2xFQyxNQUFBQSxJQUFJLEVBQUV3RCxnQkFBZ0IsQ0FBQ2QsSUFBakIsQ0FBc0JkLEdBQXRCLENBQTJCUSxDQUFELElBQU9BLENBQUMsQ0FBQ3dCLEdBQW5DLENBRDREO0FBRWxFakUsTUFBQUE7QUFGa0UsS0FBRCxDQUFuRTtBQUtBLFFBQUk2QyxPQUFKO0FBRUE7QUFDSjtBQUNBO0FBQ0E7O0FBQ0ksVUFBTUUsSUFBSSxHQUFHYyxnQkFBZ0IsQ0FBQ2QsSUFBakIsQ0FDVmQsR0FEVSxDQUNMaUMsY0FBRCxJQUFvQjtBQUN2QixZQUFNdkIsT0FBTyxHQUFHcUIsMEJBQTBCLENBQUM1QixJQUEzQixDQUFpQ0ssQ0FBRCxJQUM5Q0EsQ0FBQyxDQUFDMEIsUUFBRixDQUFXQyxJQUFYLENBQWlCL0IsQ0FBRCxJQUFPQSxDQUFDLENBQUM0QixHQUFGLEtBQVVDLGNBQWMsQ0FBQ0QsR0FBaEQsQ0FEYyxDQUFoQjs7QUFJQSxVQUFJLENBQUN0QixPQUFMLEVBQWM7QUFDWixlQUFPLElBQVA7QUFDRDs7QUFFREUsTUFBQUEsT0FBTyxHQUFHRixPQUFPLENBQUNFLE9BQWxCO0FBRUEsWUFBTXdCLE9BQU8sR0FBRzFCLE9BQU8sQ0FBQ3dCLFFBQVIsQ0FBaUIvQixJQUFqQixDQUNiQyxDQUFELElBQU9BLENBQUMsQ0FBQzRCLEdBQUYsS0FBVUMsY0FBYyxDQUFDRCxHQURsQixDQUFoQjtBQUdBLFlBQU07QUFBRWIsUUFBQUEsS0FBRjtBQUFTOUUsUUFBQUE7QUFBVCxVQUNKK0YsT0FBTyxDQUFDQyxhQUFSLENBQXNCbEMsSUFBdEIsQ0FDR21DLEVBQUQsSUFBUUEsRUFBRSxDQUFDQyxVQUFILEtBQWtCTixjQUFjLENBQUNPLHNCQUQzQyxLQUVLSixPQUFPLENBQUNDLGFBQVIsQ0FBc0JsQyxJQUF0QixDQUE0QkssQ0FBRCxJQUFPQSxDQUFDLENBQUMrQixVQUFGLEtBQWlCLFNBQW5ELENBSFA7QUFLQSxZQUFNakIsS0FBSyxHQUFHSCxLQUFkO0FBQ0EsWUFBTUksR0FBRyxHQUFJSixLQUFLLEdBQUcsR0FBVCxJQUFpQixNQUFNUCxPQUFPLENBQUMxQyxPQUEvQixDQUFaO0FBRUE7QUFDRXVFLFFBQUFBLFNBQVMsRUFBRS9CLE9BQU8sQ0FBQzlGLEVBRHJCO0FBRUU4SCxRQUFBQSxnQkFBZ0IsRUFBRU4sT0FBTyxDQUFDeEgsRUFGNUI7QUFHRW5FLFFBQUFBLElBQUksRUFBRWlLLE9BQU8sQ0FBQ2pLLElBSGhCO0FBSUV5SyxRQUFBQSxRQUFRLEVBQUVlLGNBQWMsQ0FBQ2YsUUFBZixJQUEyQixDQUp2QztBQUtFTixRQUFBQSxPQUxGO0FBTUVPLFFBQUFBLEtBQUssRUFBRTtBQUNMRyxVQUFBQSxLQURLO0FBRUxDLFVBQUFBLEdBRks7QUFHTEMsVUFBQUEsR0FBRyxFQUFFWixPQUhBO0FBSUx2RSxVQUFBQTtBQUpLO0FBTlQsU0FZSytGLE9BWkw7QUFjRCxLQXJDVSxFQXNDVjdCLE1BdENVLENBc0NGQyxDQUFELElBQU8sQ0FBQyxDQUFDQSxDQXRDTixDQUFiLENBakNrQyxDQXlFbEM7O0FBQ0EsUUFBSW1DLEtBQUssR0FBRzlCLFNBQVMsQ0FBQztBQUFFQyxNQUFBQSxJQUFGO0FBQVFGLE1BQUFBO0FBQVIsS0FBRCxDQUFyQixDQTFFa0MsQ0E0RWxDOztBQUNBLFFBQUlnQyxlQUFlLEdBQUc5QixJQUF0Qjs7QUFDQSxRQUFJQSxJQUFJLENBQUN6QyxNQUFMLEdBQWMsQ0FBZCxJQUFtQnpFLE9BQXZCLEVBQWdDO0FBQzlCLFlBQU07QUFDSjRELFFBQUFBO0FBREksVUFFRjlHLG1CQUFPLENBQUMsK0dBQUQsQ0FGWDs7QUFHQSxZQUFNaUgsY0FBYyxHQUFHSCw4QkFBOEIsQ0FBQztBQUNwRDVELFFBQUFBLE9BRG9EO0FBRXBEd0MsUUFBQUEsTUFBTSxFQUFFdUcsS0FBSyxDQUFDckI7QUFGc0MsT0FBRCxDQUFyRCxDQUo4QixDQVM5Qjs7QUFDQXNCLE1BQUFBLGVBQWUsR0FBRzlCLElBQUksQ0FBQ2QsR0FBTCxDQUFVNkMsUUFBRCxJQUFjO0FBQ3ZDLGNBQU1DLGNBQWMsR0FDakJELFFBQVEsQ0FBQzFCLEtBQVQsQ0FBZUcsS0FBZixHQUF1QnVCLFFBQVEsQ0FBQzNCLFFBQWpDLEdBQTZDeUIsS0FBSyxDQUFDckIsS0FEckQ7QUFHQTtBQUNSO0FBQ0E7QUFDQTs7QUFDUSxjQUFNeUIsaUJBQWlCLEdBQUdwRixjQUFjLEdBQUdtRixjQUEzQztBQUVBLGNBQU14QixLQUFLLEdBQ1R1QixRQUFRLENBQUMxQixLQUFULENBQWVHLEtBQWYsR0FBdUJ5QixpQkFBaUIsR0FBR0YsUUFBUSxDQUFDM0IsUUFEdEQ7QUFFQSxjQUFNSyxHQUFHLEdBQUlELEtBQUssR0FBRyxHQUFULElBQWlCLE1BQU11QixRQUFRLENBQUNqQyxPQUFULENBQWlCMUMsT0FBeEMsQ0FBWjtBQUVBLCtDQUNLMkUsUUFETDtBQUVFMUIsVUFBQUEsS0FBSyxrQ0FDQTBCLFFBQVEsQ0FBQzFCLEtBRFQ7QUFFSEcsWUFBQUEsS0FGRztBQUdIQyxZQUFBQTtBQUhHO0FBRlA7QUFRRCxPQXRCaUIsQ0FBbEIsQ0FWOEIsQ0FrQzlCOztBQUNBb0IsTUFBQUEsS0FBSyxHQUFHOUIsU0FBUyxDQUFDO0FBQUVDLFFBQUFBLElBQUksRUFBRThCLGVBQVI7QUFBeUJoQyxRQUFBQTtBQUF6QixPQUFELENBQWpCO0FBQ0ErQixNQUFBQSxLQUFLLENBQUNsQixRQUFOLEdBQWlCOUQsY0FBakI7QUFDRDs7QUFFRCxXQUFPO0FBQ0wvRCxNQUFBQSxPQURLO0FBRUxrSCxNQUFBQSxJQUFJLEVBQUU4QixlQUZEO0FBR0xELE1BQUFBO0FBSEssS0FBUDtBQUtEOztBQTNIYyxDQUFqQjs7Ozs7Ozs7Ozs7Ozs7OztBQ2xCQSxNQUFNO0FBQUVLLEVBQUFBLFVBQUY7QUFBY0MsRUFBQUE7QUFBZCxJQUE4QnZNLG1CQUFPLENBQUMscURBQUQsQ0FBM0M7O0FBRUFFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQixlQUFlcU0sY0FBZixDQUE4QkMsUUFBOUIsRUFBd0M7QUFDdkQsUUFBTUMsUUFBUSxHQUFHLE1BQU1ILFdBQVcsRUFBbEM7QUFDQSxRQUFNbEQsUUFBUSxHQUFHLE1BQU1pRCxVQUFVLENBQUM7QUFDaENoRSxJQUFBQSxTQUFTLEVBQUU7QUFDVHFFLE1BQUFBLEtBQUs7QUFDSEQsUUFBQUE7QUFERyxTQUVBRCxRQUZBO0FBREksS0FEcUI7QUFPaENwRSxJQUFBQSxLQUFLLEVBQUc7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFuQm9DLEdBQUQsQ0FBakM7QUFzQkEsU0FBT2dCLFFBQVEsQ0FBQ1gsSUFBVCxDQUFjK0QsUUFBZCxDQUF1QkcsTUFBOUI7QUFDRCxDQXpCRDs7Ozs7Ozs7OztBQ0ZBLE1BQU07QUFBRU4sRUFBQUEsVUFBRjtBQUFjQyxFQUFBQTtBQUFkLElBQThCdk0sbUJBQU8sQ0FBQyxxREFBRCxDQUEzQzs7QUFFQUUsTUFBTSxDQUFDQyxPQUFQLEdBQWlCLGVBQWUwTSxXQUFmLENBQTJCO0FBQUVoQixFQUFBQSxVQUFGO0FBQWNpQixFQUFBQTtBQUFkLENBQTNCLEVBQThEO0FBQzdFLFFBQU1KLFFBQVEsR0FBRyxNQUFNSCxXQUFXLEVBQWxDO0FBQ0EsUUFBTWxELFFBQVEsR0FBRyxNQUFNaUQsVUFBVSxDQUFDO0FBQ2hDaEUsSUFBQUEsU0FBUyxFQUFFO0FBQ1RvRSxNQUFBQSxRQURTO0FBRVRiLE1BQUFBLFVBRlM7QUFHVGlCLE1BQUFBO0FBSFMsS0FEcUI7QUFNaEN6RSxJQUFBQSxLQUFLLEVBQUc7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBN0JvQyxHQUFELENBQWpDO0FBZ0NBLFNBQU9nQixRQUFRLENBQUNYLElBQVQsQ0FBYytELFFBQWQsQ0FBdUIzSixHQUE5QjtBQUNELENBbkNEOzs7Ozs7Ozs7O0FDRkEsTUFBTThKLE1BQU0sR0FBRzVNLG1CQUFPLENBQUMsa0ZBQUQsQ0FBdEI7O0FBQ0EsTUFBTXNFLE1BQU0sR0FBR3RFLG1CQUFPLENBQUMsa0ZBQUQsQ0FBdEI7O0FBQ0EsTUFBTThDLEdBQUcsR0FBRzlDLG1CQUFPLENBQUMsNEVBQUQsQ0FBbkI7O0FBRUFFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmeU0sRUFBQUEsTUFEZTtBQUVmdEksRUFBQUEsTUFGZTtBQUdmeEIsRUFBQUE7QUFIZSxDQUFqQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ0pBLE1BQU07QUFBRXdKLEVBQUFBLFVBQUY7QUFBY0MsRUFBQUE7QUFBZCxJQUE4QnZNLG1CQUFPLENBQUMscURBQUQsQ0FBM0M7O0FBRUFFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQixlQUFlNE0sY0FBZixPQUF1RDtBQUFBLE1BQXpCO0FBQUVsQixJQUFBQTtBQUFGLEdBQXlCO0FBQUEsTUFBUm1CLElBQVE7O0FBQ3RFLFFBQU1OLFFBQVEsR0FBRyxNQUFNSCxXQUFXLEVBQWxDO0FBQ0EsUUFBTWxELFFBQVEsR0FBRyxNQUFNaUQsVUFBVSxDQUFDO0FBQ2hDaEUsSUFBQUEsU0FBUztBQUNQb0UsTUFBQUEsUUFETztBQUVQYixNQUFBQTtBQUZPLE9BR0ptQixJQUhJLENBRHVCO0FBTWhDM0UsSUFBQUEsS0FBSyxFQUFHO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUF0Qm9DLEdBQUQsQ0FBakM7QUF5QkEsU0FBT2dCLFFBQVEsQ0FBQ1gsSUFBVCxDQUFjK0QsUUFBZCxDQUF1Qm5JLE1BQTlCO0FBQ0QsQ0E1QkQ7Ozs7Ozs7Ozs7QUNGQSxNQUFNdEIsTUFBTSxHQUFHaEQsbUJBQU8sQ0FBQyw0REFBRCxDQUF0Qjs7QUFDQSxNQUFNaU4sU0FBUyxHQUFHak4sbUJBQU8sQ0FBQyxrRUFBRCxDQUF6Qjs7QUFFQUUsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2Y2QyxFQUFBQSxNQURlO0FBRWZpSyxFQUFBQTtBQUZlLENBQWpCOzs7Ozs7Ozs7O0FDSEEsTUFBTTtBQUFFQyxFQUFBQSxhQUFGO0FBQWlCQyxFQUFBQTtBQUFqQixJQUF5Q25OLG1CQUFPLENBQUMscURBQUQsQ0FBdEQ7O0FBRUFFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQixlQUFlaU4sV0FBZixDQUEyQjlFLFNBQTNCLEVBQXNDO0FBQ3JELFFBQU1lLFFBQVEsR0FBRyxNQUFNNkQsYUFBYSxDQUFDO0FBQ25DNUUsSUFBQUEsU0FBUyxFQUFFNkUsbUJBQW1CLENBQUM3RSxTQUFELENBREs7QUFFbkNELElBQUFBLEtBQUssRUFBRztBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQTFCdUMsR0FBRCxDQUFwQztBQTZCQSxTQUFPZ0IsUUFBUSxDQUFDWCxJQUFULENBQWMxRixNQUFkLENBQXFCNEosTUFBNUI7QUFDRCxDQS9CRDs7Ozs7Ozs7OztBQ0ZBLE1BQU07QUFBRU0sRUFBQUE7QUFBRixJQUFvQmxOLG1CQUFPLENBQUMscURBQUQsQ0FBakM7O0FBRUFFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQixlQUFla04sUUFBZixDQUF3Qm5KLEVBQXhCLEVBQTRCO0FBQzNDLFFBQU1tRixRQUFRLEdBQUcsTUFBTTZELGFBQWEsQ0FBQztBQUNuQzVFLElBQUFBLFNBQVMsRUFBRTtBQUNUcEUsTUFBQUE7QUFEUyxLQUR3QjtBQUluQ21FLElBQUFBLEtBQUssRUFBRztBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBdEZ1QyxHQUFELENBQXBDO0FBeUZBLFFBQU1pRixLQUFLLEdBQUdqRSxRQUFRLENBQUNYLElBQVQsQ0FBYzFGLE1BQWQsQ0FBcUJGLEdBQW5DOztBQUVBLE1BQUksQ0FBQ3dLLEtBQUwsRUFBWTtBQUNWLFVBQU0sSUFBSS9HLEtBQUosQ0FBVywwQkFBeUJyQyxFQUFHLEdBQXZDLENBQU47QUFDRDs7QUFFRCxTQUFPb0osS0FBUDtBQUNELENBakdEOzs7Ozs7Ozs7O0FDRkEsTUFBTVYsTUFBTSxHQUFHNU0sbUJBQU8sQ0FBQyx5RUFBRCxDQUF0Qjs7QUFDQSxNQUFNc0UsTUFBTSxHQUFHdEUsbUJBQU8sQ0FBQyx5RUFBRCxDQUF0Qjs7QUFDQSxNQUFNOEMsR0FBRyxHQUFHOUMsbUJBQU8sQ0FBQyxtRUFBRCxDQUFuQjs7QUFDQSxNQUFNdU4sMkJBQTJCLEdBQUd2TixtQkFBTyxDQUFDLGlIQUFELENBQTNDOztBQUVBRSxNQUFNLENBQUNDLE9BQVAsR0FBaUI7QUFDZnlNLEVBQUFBLE1BRGU7QUFFZnRJLEVBQUFBLE1BRmU7QUFHZnhCLEVBQUFBLEdBSGU7QUFJZnlLLEVBQUFBO0FBSmUsQ0FBakI7Ozs7Ozs7Ozs7QUNMQSxNQUFNO0FBQUVqQixFQUFBQSxVQUFGO0FBQWNhLEVBQUFBO0FBQWQsSUFBc0NuTixtQkFBTyxDQUFDLHFEQUFELENBQW5EOztBQUVBRSxNQUFNLENBQUNDLE9BQVAsR0FBaUIsZUFBZXFOLFdBQWYsQ0FBMkJ0SixFQUEzQixFQUErQm9FLFNBQS9CLEVBQTBDO0FBQ3pELFFBQU1lLFFBQVEsR0FBRyxNQUFNaUQsVUFBVSxDQUFDO0FBQ2hDaEUsSUFBQUEsU0FBUyxFQUFFO0FBQ1RwRSxNQUFBQSxFQURTO0FBRVR5SSxNQUFBQSxLQUFLLEVBQUVRLG1CQUFtQixDQUFDN0UsU0FBRDtBQUZqQixLQURxQjtBQUtoQ0QsSUFBQUEsS0FBSyxFQUFHO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQW5Cb0MsR0FBRCxDQUFqQztBQXNCQSxTQUFPZ0IsUUFBUSxDQUFDWCxJQUFULENBQWM0RSxLQUFkLENBQW9CaEosTUFBM0I7QUFDRCxDQXhCRDs7Ozs7Ozs7OztBQ0ZBLE1BQU07QUFBRTRJLEVBQUFBO0FBQUYsSUFBb0JsTixtQkFBTyxDQUFDLHFEQUFELENBQWpDOztBQUVBRSxNQUFNLENBQUNDLE9BQVAsR0FBaUIsU0FBU29OLDJCQUFULENBQXFDO0FBQUVySixFQUFBQTtBQUFGLENBQXJDLEVBQTZDO0FBQzVELE1BQUl1SixPQUFPLEdBQUcsQ0FBZDtBQUNBLFFBQU1DLFVBQVUsR0FBRyxFQUFuQjtBQUVBLFNBQU8sSUFBSUMsT0FBSixDQUFZLENBQUNDLE9BQUQsRUFBVUMsTUFBVixLQUFxQjtBQUN0QyxLQUFDLGVBQWVDLEtBQWYsR0FBdUI7QUFDdEIsWUFBTXpFLFFBQVEsR0FBRyxNQUFNNkQsYUFBYSxDQUFDO0FBQ25DN0UsUUFBQUEsS0FBSyxFQUFHO0FBQ2hCO0FBQ0E7QUFDQSx5QkFBeUJuRSxFQUFHO0FBQzVCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVYyQyxPQUFELENBQXBDOztBQWFBLFVBQUltRixRQUFRLENBQUNYLElBQVQsSUFBaUJXLFFBQVEsQ0FBQ1gsSUFBVCxDQUFjMUYsTUFBZCxDQUFxQkYsR0FBMUMsRUFBK0M7QUFDN0M4SyxRQUFBQSxPQUFPO0FBQ1IsT0FGRCxNQUVPO0FBQ0xILFFBQUFBLE9BQU8sSUFBSSxDQUFYOztBQUNBLFlBQUlBLE9BQU8sR0FBR0MsVUFBZCxFQUEwQjtBQUN4QkcsVUFBQUEsTUFBTSxDQUNILDhDQUE2QzNKLEVBQUcsbUJBRDdDLENBQU47QUFHRCxTQUpELE1BSU87QUFDTDZKLFVBQUFBLFVBQVUsQ0FBQ0QsS0FBRCxFQUFRLElBQVIsQ0FBVjtBQUNEO0FBQ0Y7QUFDRixLQTFCRDtBQTJCRCxHQTVCTSxDQUFQO0FBNkJELENBakNEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDRkEsTUFBTUUsU0FBUyxHQUFHaE8sbUJBQU8sQ0FBQyw0QkFBRCxDQUF6Qjs7QUFDQSxNQUFNaU8sS0FBSyxHQUFHak8sbUJBQU8sQ0FBQyw4QkFBRCxDQUFyQjs7QUFFQSxNQUFNa08sNkJBQTZCLEdBQUdsTixPQUFPLENBQUNDLEdBQVIsQ0FBWWlOLDZCQUFsRDtBQUNBLE1BQU1DLDJCQUEyQixHQUFHbk4sT0FBTyxDQUFDQyxHQUFSLENBQVlrTiwyQkFBaEQ7QUFDQSxNQUFNQywrQkFBK0IsR0FDbkNwTixPQUFPLENBQUNDLEdBQVIsQ0FBWW1OLCtCQURkO0FBR0FKLFNBQVMsQ0FDUEUsNkJBRE8sRUFFUCxtREFGTyxDQUFUOztBQUtBLFNBQVNHLGVBQVQsQ0FBeUJDLEdBQXpCLEVBQThCO0FBQzVCLFNBQU8sZUFBZUMsT0FBZixDQUF1QjtBQUFFbEcsSUFBQUEsS0FBRjtBQUFTQyxJQUFBQSxTQUFUO0FBQW9Ca0csSUFBQUE7QUFBcEIsR0FBdkIsRUFBNEQ7QUFDakVSLElBQUFBLFNBQVMsQ0FDUEcsMkJBRE8sRUFFUCxpREFGTyxDQUFUO0FBSUFILElBQUFBLFNBQVMsQ0FDUEksK0JBRE8sRUFFUCxxREFGTyxDQUFUO0FBS0EsVUFBTS9FLFFBQVEsR0FBRyxNQUFNNEUsS0FBSyxDQUFDSyxHQUFELEVBQU07QUFDaEN6UCxNQUFBQSxNQUFNLEVBQUUsTUFEd0I7QUFFaENGLE1BQUFBLE9BQU8sRUFBRTtBQUNQLHdCQUFnQixrQkFEVDtBQUVQLHlDQUFpQ3dQLDJCQUYxQjtBQUdQLDZDQUFxQ0M7QUFIOUIsT0FGdUI7QUFPaENLLE1BQUFBLElBQUksRUFBRUMsSUFBSSxDQUFDQyxTQUFMLENBQWU7QUFBRUgsUUFBQUEsYUFBRjtBQUFpQm5HLFFBQUFBLEtBQWpCO0FBQXdCQyxRQUFBQTtBQUF4QixPQUFmO0FBUDBCLEtBQU4sQ0FBNUI7QUFVQSxVQUFNc0csSUFBSSxHQUFHLE1BQU12RixRQUFRLENBQUN1RixJQUFULEVBQW5COztBQUVBLFFBQUlBLElBQUksQ0FBQ0MsTUFBVCxFQUFpQjtBQUNmeEwsTUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlvTCxJQUFJLENBQUNDLFNBQUwsQ0FBZUMsSUFBSSxDQUFDQyxNQUFwQixFQUE0QixJQUE1QixFQUFrQyxDQUFsQyxDQUFaO0FBQ0Q7O0FBRUQsV0FBT0QsSUFBUDtBQUNELEdBM0JEO0FBNEJELEVBRUQ7OztBQUNBLFNBQVN6QixtQkFBVCxPQUEwRTtBQUFBLE1BQTdDO0FBQUVWLElBQUFBLFFBQUY7QUFBWXJDLElBQUFBLElBQVo7QUFBa0I2QixJQUFBQSxLQUFsQjtBQUF5Qi9JLElBQUFBO0FBQXpCLEdBQTZDO0FBQUEsTUFBUjhKLElBQVE7O0FBQ3hFLHFFQUNLQSxJQURMLEdBRU1mLEtBQUssSUFBSTtBQUNYQSxJQUFBQSxLQUFLLEVBQUU7QUFDTHJCLE1BQUFBLEtBQUssRUFBRXFCLEtBQUssQ0FBQ3JCLEtBRFI7QUFFTEMsTUFBQUEsR0FBRyxFQUFFb0IsS0FBSyxDQUFDcEIsR0FGTjtBQUdMbEYsTUFBQUEsUUFBUSxFQUFFc0csS0FBSyxDQUFDdEcsUUFIWDtBQUlMbUYsTUFBQUEsR0FBRyxFQUFFbUIsS0FBSyxDQUFDbkI7QUFKTjtBQURJLEdBRmYsR0FVTVYsSUFBSSxJQUFJO0FBQ1ZBLElBQUFBLElBQUksRUFBRUEsSUFBSSxDQUFDZCxHQUFMLENBQVMsU0FBU3dGLG1CQUFULENBQTZCQyxJQUE3QixFQUFtQztBQUNoRCxZQUFNO0FBQ0pDLFFBQUFBLE1BQU0sR0FBRyxFQURMO0FBRUp6SCxRQUFBQSxJQUZJO0FBR0orRCxRQUFBQSxHQUhJO0FBSUpTLFFBQUFBLFNBSkk7QUFLSkMsUUFBQUEsZ0JBTEk7QUFNSnhCLFFBQUFBLFFBTkk7QUFPSkMsUUFBQUE7QUFQSSxVQVFGc0UsSUFSSjtBQVVBLGFBQU87QUFDTHhILFFBQUFBLElBREs7QUFFTCtELFFBQUFBLEdBRks7QUFHTFMsUUFBQUEsU0FISztBQUlMQyxRQUFBQSxnQkFKSztBQUtMeEIsUUFBQUEsUUFMSztBQU1MQyxRQUFBQSxLQU5LO0FBT0x3RSxRQUFBQSxRQUFRLEVBQUVELE1BQU0sSUFBSUEsTUFBTSxDQUFDLENBQUQsQ0FBaEIsSUFBdUJBLE1BQU0sQ0FBQyxDQUFELENBQU4sQ0FBVUU7QUFQdEMsT0FBUDtBQVNELEtBcEJLO0FBREksR0FWZCxHQWlDTXpDLFFBQVEsSUFBSTtBQUNkQSxJQUFBQSxRQUFRLEVBQUU7QUFDUlosTUFBQUEsVUFBVSxFQUFFWSxRQUFRLENBQUNaLFVBRGI7QUFFUnNELE1BQUFBLFNBQVMsRUFBRTFDLFFBQVEsQ0FBQzBDLFNBQVQsSUFBc0IsSUFGekI7QUFHUkMsTUFBQUEsUUFBUSxFQUFFM0MsUUFBUSxDQUFDMkMsUUFBVCxJQUFxQixJQUh2QjtBQUlSQyxNQUFBQSxTQUFTLEVBQUU1QyxRQUFRLENBQUM0QyxTQUFULElBQXNCLENBQy9CO0FBQ0VDLFFBQUFBLElBQUksRUFBRSxTQURSO0FBRUV6TyxRQUFBQSxLQUFLLEVBQUU0TCxRQUFRLENBQUM1TCxLQUFULElBQWtCME87QUFGM0IsT0FEK0I7QUFKekI7QUFESSxHQWpDbEI7QUErQ0Q7O0FBRUQsTUFBTWhELFdBQVcsR0FBSSxZQUFZO0FBQy9CLE1BQUlHLFFBQUo7QUFFQSxTQUFPLFlBQVk7QUFDakIsUUFBSUEsUUFBSixFQUFjO0FBQ1osYUFBT0EsUUFBUDtBQUNEOztBQUVELFVBQU04QyxnQkFBZ0IsR0FBRyxNQUFNMUgsZ0JBQWdCLENBQUM7QUFDOUNPLE1BQUFBLEtBQUssRUFBRztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQVBvRCxLQUFELENBQS9DO0FBU0FxRSxJQUFBQSxRQUFRLEdBQUc4QyxnQkFBZ0IsQ0FBQzlHLElBQWpCLENBQXNCK0csTUFBdEIsQ0FBNkJ2TCxFQUF4QztBQUVBLFdBQU93SSxRQUFQO0FBQ0QsR0FqQkQ7QUFrQkQsQ0FyQm1CLEVBQXBCO0FBdUJBO0FBQ0E7QUFDQTtBQUNBOzs7QUFDQSxNQUFNNUUsZ0JBQWdCLEdBQUd1RyxlQUFlLENBQ3JDLCtCQUE4QkgsNkJBQThCLFlBRHZCLENBQXhDO0FBSUE7QUFDQTtBQUNBO0FBQ0E7O0FBQ0EsTUFBTW5HLGFBQWEsR0FBR3NHLGVBQWUsQ0FDbEMsK0JBQThCSCw2QkFBOEIsU0FEMUIsQ0FBckM7QUFJQTtBQUNBO0FBQ0E7QUFDQTs7QUFDQSxNQUFNaEIsYUFBYSxHQUFHbUIsZUFBZSxDQUNsQywrQkFBOEJILDZCQUE4QixTQUQxQixDQUFyQztBQUlBO0FBQ0E7QUFDQTtBQUNBOztBQUNBLE1BQU01QixVQUFVLEdBQUcrQixlQUFlLENBQUMscUNBQUQsQ0FBbEM7QUFFQW5PLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmZ04sRUFBQUEsbUJBRGU7QUFFZnJGLEVBQUFBLGdCQUZlO0FBR2ZDLEVBQUFBLGFBSGU7QUFJZm1GLEVBQUFBLGFBSmU7QUFLZlosRUFBQUEsVUFMZTtBQU1mQyxFQUFBQTtBQU5lLENBQWpCOzs7Ozs7Ozs7O0FDcEpBLE1BQU07QUFBRW1ELEVBQUFBO0FBQUYsSUFBZ0IxUCxtQkFBTyxDQUFDLHNEQUFELENBQTdCOztBQUVBLE1BQU0yUCxxQkFBcUIsR0FBRzNQLG1CQUFPLENBQUMsZ0ZBQUQsQ0FBckM7O0FBQ0EsTUFBTTRQLGlCQUFpQixHQUFHNVAsbUJBQU8sQ0FBQywwRUFBRCxDQUFqQzs7QUFFQUUsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2Z1UCxFQUFBQSxTQURlO0FBRWZDLEVBQUFBLHFCQUZlO0FBR2ZDLEVBQUFBO0FBSGUsQ0FBakI7Ozs7Ozs7Ozs7QUNMQTFQLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQixlQUFld1AscUJBQWYsQ0FBcUNFLE9BQXJDLEVBQThDO0FBQzdELE1BQUk7QUFDRixVQUFNQyxTQUFTLEdBQUc5UCxtQkFBTyxDQUFDLGtCQUFELENBQXpCOztBQUVBLFVBQU07QUFBRXlGLE1BQUFBO0FBQUYsUUFBcUJ6RixtQkFBTyxDQUFDLGlEQUFELENBQWxDOztBQUNBLFVBQU07QUFBRWdELE1BQUFBO0FBQUYsUUFBYWhELG1CQUFPLENBQUMsMkRBQUQsQ0FBMUI7O0FBQ0EsVUFBTTtBQUFFMFAsTUFBQUE7QUFBRixRQUFnQjFQLG1CQUFPLENBQUMsc0RBQUQsQ0FBN0I7O0FBRUEsVUFBTXNOLEtBQUssR0FBRyxNQUFNdEssTUFBTSxDQUFDRixHQUFQLENBQVcrTSxPQUFYLENBQXBCO0FBRUEsVUFBTTtBQUFFaFAsTUFBQUE7QUFBRixRQUFZeU0sS0FBSyxDQUFDYixRQUFOLENBQWU0QyxTQUFmLENBQXlCLENBQXpCLENBQWxCOztBQUVBLFFBQUksQ0FBQ3hPLEtBQUwsRUFBWTtBQUNWLGFBQU87QUFDTGtQLFFBQUFBLE9BQU8sRUFBRSxLQURKO0FBRUxDLFFBQUFBLEtBQUssRUFBRTtBQUZGLE9BQVA7QUFJRDs7QUFFRCxVQUFNO0FBQUVDLE1BQUFBO0FBQUYsUUFBV0gsU0FBUyxDQUFFO0FBQ2hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5Q0FBeUN4QyxLQUFLLENBQUNwSixFQUFHO0FBQ2xEO0FBQ0E7QUFDQSxzQ0FBc0NvSixLQUFLLENBQUNiLFFBQU4sQ0FBZTBDLFNBQVU7QUFDL0QscUNBQXFDN0IsS0FBSyxDQUFDYixRQUFOLENBQWUyQyxRQUFTO0FBQzdELHlDQUF5Q3ZPLEtBQU07QUFDL0M7QUFDQTtBQUNBLGlDQUFpQzRFLGNBQWMsQ0FBQztBQUM5QkMsTUFBQUEsTUFBTSxFQUFFNEgsS0FBSyxDQUFDckIsS0FBTixDQUFZckIsS0FEVTtBQUU5QmpGLE1BQUFBLFFBQVEsRUFBRTJILEtBQUssQ0FBQ3JCLEtBQU4sQ0FBWXRHO0FBRlEsS0FBRCxDQUc1QjtBQUNuQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZ0JBQWdCMkgsS0FBSyxDQUFDbEQsSUFBTixDQUFXZCxHQUFYLENBQ0N5RixJQUFELElBQVc7QUFDM0IscURBQXFEQSxJQUFJLENBQUN4SCxJQUFLLEtBQzdDd0gsSUFBSSxDQUFDekQsR0FDTjtBQUNqQixpREFBaUR5RCxJQUFJLENBQUN2RSxRQUFTO0FBQy9ELHFEQUFxRC9FLGNBQWMsQ0FBQztBQUNoREMsTUFBQUEsTUFBTSxFQUFFcUosSUFBSSxDQUFDdEUsS0FBTCxDQUFXRyxLQUFYLEdBQW1CbUUsSUFBSSxDQUFDdkUsUUFEZ0I7QUFFaEQ3RSxNQUFBQSxRQUFRLEVBQUVvSixJQUFJLENBQUN0RSxLQUFMLENBQVc5RTtBQUYyQixLQUFELENBRzlDO0FBQ3JCLHNCQVZnQixDQVdBO0FBQ2hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQTlDOEIsQ0FBMUI7QUFnREEsVUFBTStKLFNBQVMsQ0FBQztBQUNkUSxNQUFBQSxFQUFFLEVBQUVyUCxLQURVO0FBRWRzUCxNQUFBQSxPQUFPLEVBQUUsZUFGSztBQUdkRixNQUFBQTtBQUhjLEtBQUQsQ0FBZjtBQU1BLFdBQU87QUFDTEYsTUFBQUEsT0FBTyxFQUFFO0FBREosS0FBUDtBQUdELEdBM0VELENBMkVFLE9BQU9DLEtBQVAsRUFBYztBQUNkM00sSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVkwTSxLQUFaO0FBQ0EsV0FBTztBQUNMRCxNQUFBQSxPQUFPLEVBQUUsS0FESjtBQUVMQyxNQUFBQTtBQUZLLEtBQVA7QUFJRDtBQUNGLENBbkZEOzs7Ozs7Ozs7O0FDQUEsTUFBTTtBQUFFTixFQUFBQTtBQUFGLElBQWdCMVAsbUJBQU8sQ0FBQyxzREFBRCxDQUE3Qjs7QUFFQUUsTUFBTSxDQUFDQyxPQUFQLEdBQWlCLGVBQWVpUSxrQkFBZixDQUFrQztBQUFFQyxFQUFBQSxTQUFGO0FBQWF4UCxFQUFBQTtBQUFiLENBQWxDLEVBQXdEO0FBQ3ZFLE1BQUk7QUFDRixVQUFNaVAsU0FBUyxHQUFHOVAsbUJBQU8sQ0FBQyxrQkFBRCxDQUF6Qjs7QUFDQSxVQUFNO0FBQUVpUSxNQUFBQTtBQUFGLFFBQVdILFNBQVMsQ0FBRTtBQUNoQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDTyxTQUFVO0FBQzNDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FYOEIsQ0FBMUI7QUFhQSxVQUFNWCxTQUFTLENBQUM7QUFDZFEsTUFBQUEsRUFBRSxFQUFFclAsS0FEVTtBQUVkc1AsTUFBQUEsT0FBTyxFQUFFLGtCQUZLO0FBR2RGLE1BQUFBO0FBSGMsS0FBRCxDQUFmO0FBTUEsV0FBTztBQUNMRixNQUFBQSxPQUFPLEVBQUU7QUFESixLQUFQO0FBR0QsR0F4QkQsQ0F3QkUsT0FBT0MsS0FBUCxFQUFjO0FBQ2QzTSxJQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTBNLEtBQVo7QUFDQSxXQUFPO0FBQ0xELE1BQUFBLE9BQU8sRUFBRSxLQURKO0FBRUxDLE1BQUFBO0FBRkssS0FBUDtBQUlEO0FBQ0YsQ0FoQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7QUNGQSxNQUFNaEMsU0FBUyxHQUFHaE8sbUJBQU8sQ0FBQyw0QkFBRCxDQUF6Qjs7QUFFQSxNQUFNc1EsZ0JBQWdCLEdBQUd0UCxPQUFPLENBQUNDLEdBQVIsQ0FBWXFQLGdCQUFyQztBQUNBLE1BQU1DLFVBQVUsR0FBR3ZQLE9BQU8sQ0FBQ0MsR0FBUixDQUFZc1AsVUFBL0I7QUFFQXJRLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmdVAsRUFBQUEsU0FBUyxDQUFDcFAsSUFBRCxFQUFPO0FBQ2QwTixJQUFBQSxTQUFTLENBQUNzQyxnQkFBRCxFQUFtQiwwQ0FBbkIsQ0FBVDtBQUNBdEMsSUFBQUEsU0FBUyxDQUFDdUMsVUFBRCxFQUFhLHVDQUFiLENBQVQ7O0FBRUEsVUFBTUMsTUFBTSxHQUFHeFEsbUJBQU8sQ0FBQyxzQ0FBRCxDQUF0Qjs7QUFDQXdRLElBQUFBLE1BQU0sQ0FBQ0MsU0FBUCxDQUFpQkgsZ0JBQWpCO0FBRUEsV0FBT0UsTUFBTSxDQUFDRSxJQUFQO0FBQ0x0SCxNQUFBQSxJQUFJLEVBQUVtSDtBQURELE9BRUZqUSxJQUZFLEVBQVA7QUFJRDs7QUFaYyxDQUFqQjs7Ozs7Ozs7Ozs7Ozs7OztBQ0xBSixNQUFNLENBQUNDLE9BQVAsR0FBaUIsZUFBZW9GLHNCQUFmLENBQXNDO0FBQ3JEb0wsRUFBQUEsYUFEcUQ7QUFFckR0USxFQUFBQTtBQUZxRCxDQUF0QyxFQUdkO0FBQ0QsUUFBTXdCLGFBQWEsR0FBRzdCLG1CQUFPLENBQUMsb0VBQUQsQ0FBN0I7O0FBQ0EsUUFBTTRCLFdBQVcsR0FBRzVCLG1CQUFPLENBQUMsOERBQUQsQ0FBM0I7O0FBRUEsUUFBTTtBQUFFZ0wsSUFBQUEsV0FBRjtBQUFleUIsSUFBQUE7QUFBZixNQUE0QmtFLGFBQWxDO0FBQ0EsUUFBTTtBQUFFblEsSUFBQUE7QUFBRixNQUFXSCxPQUFqQixDQUxDLENBT0Q7O0FBQ0EsUUFBTXVRLCtCQUErQixxQkFDaENuRSxRQURnQyxDQUFyQzs7QUFHQSxNQUFJak0sSUFBSixFQUFVO0FBQ1JvUSxJQUFBQSwrQkFBK0IsQ0FBQy9FLFVBQWhDLEdBQTZDckwsSUFBSSxDQUFDSyxLQUFsRDtBQUNEOztBQUVELFFBQU0rQixNQUFNLEdBQUcsTUFBTWYsYUFBYSxDQUFDaUIsR0FBZCxDQUFrQjtBQUFFa0ksSUFBQUEsV0FBRjtBQUFlM0ssSUFBQUE7QUFBZixHQUFsQixDQUFyQjtBQUVBO0FBQ0Y7QUFDQTtBQUNBOztBQUNFLFFBQU13USxnQkFBZ0IsR0FBRyxNQUFNalAsV0FBVyxDQUFDb0IsTUFBWixDQUFtQjRKLE1BQW5CLGlDQUMxQmhLLE1BRDBCO0FBRTdCNkosSUFBQUEsUUFBUSxFQUFFbUU7QUFGbUIsS0FBL0I7QUFLQSxTQUFPO0FBQ0xiLElBQUFBLE9BQU8sRUFBRSxJQURKO0FBRUxGLElBQUFBLE9BQU8sRUFBRWdCLGdCQUFnQixDQUFDM007QUFGckIsR0FBUDtBQUlELENBakNEOzs7Ozs7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUEsTUFBTXFCLHNCQUFzQixHQUFHdkYsbUJBQU8sQ0FBQyx3R0FBRCxDQUF0Qzs7QUFFQUUsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2ZvQyxFQUFBQSxPQUFPLEVBQUUsSUFETTtBQUVmQyxFQUFBQSxjQUFjLEVBQUUsRUFGRDtBQUdmK0MsRUFBQUE7QUFIZSxDQUFqQjs7Ozs7Ozs7OztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBckYsTUFBTSxDQUFDQyxPQUFQLEdBQWlCLGVBQWUyUSxhQUFmLENBQTZCO0FBQUVDLEVBQUFBO0FBQUYsQ0FBN0IsRUFBcUQ7QUFDcEUsUUFBTW5QLFdBQVcsR0FBRzVCLG1CQUFPLENBQUMsOERBQUQsQ0FBM0I7O0FBQ0EsUUFBTTtBQUFFZ1IsSUFBQUE7QUFBRixNQUFnQmhSLG1CQUFPLENBQUMsaUVBQUQsQ0FBN0IsQ0FGb0UsQ0FJcEU7OztBQUNBLFFBQU02USxnQkFBZ0IsR0FBRyxNQUFNalAsV0FBVyxDQUFDb0IsTUFBWixDQUFtQkYsR0FBbkIsQ0FBdUJpTyxrQkFBdkIsQ0FBL0I7QUFDQSxRQUFNRSxhQUFhLEdBQUdKLGdCQUFnQixDQUFDSyxPQUFqQixDQUF5QnpILElBQXpCLENBQ25CSyxDQUFELElBQU9BLENBQUMsQ0FBQ3FILFFBQUYsS0FBZSxRQURGLENBQXRCOztBQUdBLE1BQUksQ0FBQ0YsYUFBTCxFQUFvQjtBQUNsQixVQUFNLElBQUkxSyxLQUFKLENBQVcsU0FBUXdLLGtCQUFtQix3QkFBdEMsQ0FBTjtBQUNEOztBQUNELFFBQU1LLGFBQWEsR0FBR0gsYUFBYSxDQUFDcEIsT0FBcEM7O0FBQ0EsTUFBSSxDQUFDdUIsYUFBTCxFQUFvQjtBQUNsQixVQUFNLElBQUk3SyxLQUFKLENBQVcsU0FBUXdLLGtCQUFtQix1QkFBdEMsQ0FBTjtBQUNEOztBQUVELFFBQU1NLFlBQVksR0FBRyxNQUFNTCxTQUFTLEVBQXBDLENBakJvRSxDQW1CcEU7O0FBQ0EsUUFBTTtBQUNKaEIsSUFBQUEsS0FESTtBQUVKM0csSUFBQUE7QUFGSSxNQUdGLE1BQU1nSSxZQUFZLENBQUNDLGlCQUFiLENBQStCQyxRQUEvQixDQUF3Q0MsT0FBeEMsQ0FBZ0RKLGFBQWhELENBSFY7QUFLQS9OLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZME0sS0FBWixFQUFtQjNHLFFBQW5CO0FBRUE7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNDLENBaENEOzs7Ozs7Ozs7O0FDUEEsTUFBTW9JLGVBQWUsR0FBR3pRLE9BQU8sQ0FBQ0MsR0FBUixDQUFZd1EsZUFBcEM7QUFDQSxNQUFNQyxlQUFlLEdBQUcxUSxPQUFPLENBQUNDLEdBQVIsQ0FBWXlRLGVBQXBDOztBQUVBLE1BQU07QUFBRVYsRUFBQUE7QUFBRixJQUFnQmhSLG1CQUFPLENBQUMsaUVBQUQsQ0FBN0I7O0FBRUEsTUFBTTRFLGNBQWMsR0FBRzVFLG1CQUFPLENBQUMscUZBQUQsQ0FBOUI7O0FBQ0EsTUFBTTJSLElBQUksR0FBRzNSLG1CQUFPLENBQUMsK0RBQUQsQ0FBcEI7O0FBQ0EsTUFBTXdSLE9BQU8sR0FBR3hSLG1CQUFPLENBQUMscUVBQUQsQ0FBdkI7O0FBRUFFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmb0MsRUFBQUEsT0FBTyxFQUFFeUUsT0FBTyxDQUFDeUssZUFBZSxJQUFJQyxlQUFwQixDQUREO0FBRWZsUCxFQUFBQSxjQUFjLEVBQUUsRUFGRDtBQUdmd08sRUFBQUEsU0FIZTtBQUlmcE0sRUFBQUEsY0FKZTtBQUtmK00sRUFBQUEsSUFMZTtBQU1mSCxFQUFBQTtBQU5lLENBQWpCOzs7Ozs7Ozs7O0FDVEF0UixNQUFNLENBQUNDLE9BQVAsR0FBaUIsZUFBZXlSLFVBQWYsQ0FBMEI7QUFDekNiLEVBQUFBLGtCQUR5QztBQUV6Q0ssRUFBQUE7QUFGeUMsQ0FBMUIsRUFHZDtBQUNELFFBQU07QUFBRUosSUFBQUE7QUFBRixNQUFnQmhSLG1CQUFPLENBQUMsaUVBQUQsQ0FBN0I7O0FBQ0FxRCxFQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWSxhQUFaLEVBQTJCO0FBQUV5TixJQUFBQSxrQkFBRjtBQUFzQkssSUFBQUE7QUFBdEIsR0FBM0I7QUFFQSxRQUFNQyxZQUFZLEdBQUcsTUFBTUwsU0FBUyxFQUFwQyxDQUpDLENBTUQ7QUFFQTs7QUFDQSxRQUFNSyxZQUFZLENBQUNDLGlCQUFiLENBQStCdE8sTUFBL0IsQ0FBc0M2TyxXQUF0QyxDQUFrRFQsYUFBbEQsQ0FBTjtBQUVBO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQyxDQW5CRDs7Ozs7Ozs7Ozs7Ozs7OztBQ0FBbFIsTUFBTSxDQUFDQyxPQUFQLEdBQWlCLGVBQWV5RSxjQUFmLENBQThCO0FBQUUrTCxFQUFBQSxhQUFGO0FBQWlCdFEsRUFBQUE7QUFBakIsQ0FBOUIsRUFBMEQ7QUFDekUsUUFBTXVCLFdBQVcsR0FBRzVCLG1CQUFPLENBQUMsOERBQUQsQ0FBM0I7O0FBQ0EsUUFBTTZCLGFBQWEsR0FBRzdCLG1CQUFPLENBQUMsb0VBQUQsQ0FBN0I7O0FBRUEsUUFBTTtBQUFFZ1IsSUFBQUE7QUFBRixNQUFnQmhSLG1CQUFPLENBQUMsaUVBQUQsQ0FBN0I7O0FBQ0EsUUFBTThSLGtCQUFrQixHQUFHOVIsbUJBQU8sQ0FBQyxpR0FBRCxDQUFsQzs7QUFFQSxRQUFNO0FBQ0pnTCxJQUFBQSxXQURJO0FBRUp5QixJQUFBQSxRQUZJO0FBR0pzRixJQUFBQSxlQUhJO0FBSUpDLElBQUFBLFFBSkk7QUFLSkMsSUFBQUE7QUFMSSxNQU1GdEIsYUFOSjtBQU9BLFFBQU07QUFBRTVQLElBQUFBLG1CQUFGO0FBQXVCUCxJQUFBQTtBQUF2QixNQUFnQ0gsT0FBdEM7QUFFQSxNQUFJO0FBQUUwUSxJQUFBQSxrQkFBRjtBQUFzQkssSUFBQUE7QUFBdEIsTUFBd0NwRyxXQUE1QztBQUVBLFFBQU1wSSxNQUFNLEdBQUcsTUFBTWYsYUFBYSxDQUFDaUIsR0FBZCxDQUFrQjtBQUFFa0ksSUFBQUEsV0FBRjtBQUFlM0ssSUFBQUE7QUFBZixHQUFsQixDQUFyQixDQWxCeUUsQ0FvQnpFOztBQUNBLFFBQU11USwrQkFBK0IscUJBQ2hDbkUsUUFEZ0MsQ0FBckM7O0FBR0EsTUFBSWpNLElBQUosRUFBVTtBQUNSb1EsSUFBQUEsK0JBQStCLENBQUMvRSxVQUFoQyxHQUE2Q3JMLElBQUksQ0FBQ0ssS0FBbEQ7QUFDRDtBQUVEO0FBQ0Y7QUFDQTtBQUNBOzs7QUFDRSxNQUFJa1Esa0JBQUosRUFBd0I7QUFDdEIsVUFBTW5QLFdBQVcsQ0FBQ29CLE1BQVosQ0FBbUJzQixNQUFuQixDQUEwQnlNLGtCQUExQixrQ0FDRG5PLE1BREM7QUFFSjZKLE1BQUFBLFFBQVEsRUFBRW1FO0FBRk4sT0FBTjtBQUlELEdBTEQsTUFLTztBQUNMLFVBQU1DLGdCQUFnQixHQUFHLE1BQU1qUCxXQUFXLENBQUNvQixNQUFaLENBQW1CNEosTUFBbkIsaUNBQzFCaEssTUFEMEI7QUFFN0I2SixNQUFBQSxRQUFRLEVBQUVtRTtBQUZtQixPQUEvQjtBQUlBRyxJQUFBQSxrQkFBa0IsR0FBR0YsZ0JBQWdCLENBQUMzTSxFQUF0QztBQUNELEdBM0N3RSxDQTZDekU7OztBQUNBLFFBQU1nTyxZQUFZLEdBQUcsSUFBSUMsR0FBSixDQUNuQkosZUFBZSxDQUFDSyxPQUFoQixDQUF3QixzQkFBeEIsRUFBZ0RyQixrQkFBaEQsQ0FEbUIsQ0FBckI7QUFHQW1CLEVBQUFBLFlBQVksQ0FBQ0csWUFBYixDQUEwQkMsTUFBMUIsQ0FBaUMsZUFBakMsRUFBa0QscUJBQWxEOztBQUVBLFFBQU1DLHFCQUFxQixtQ0FDdEJULGtCQUFrQixDQUFDbFAsTUFBRCxDQURJO0FBRXpCNFAsSUFBQUEsZ0JBQWdCLEVBQUUsSUFGTztBQUd6QkMsSUFBQUEsaUJBQWlCLEVBQUU3UCxNQUFNLENBQUNxSixLQUFQLENBQWF0RyxRQUFiLElBQXlCLEtBSG5CO0FBSXpCMEIsSUFBQUEsTUFBTSxFQUFFLE9BSmlCO0FBS3pCcUwsSUFBQUEsYUFBYSxFQUFFO0FBQ2JDLE1BQUFBLEtBQUssRUFBRVgsUUFETTtBQUViWSxNQUFBQSxRQUFRLEVBQUVYLFdBRkc7QUFHYkMsTUFBQUEsWUFBWSxFQUFFQSxZQUFZLENBQUNXLFFBQWIsRUFIRDtBQUlibEIsTUFBQUEsSUFBSSxFQUFHLEdBQUU1USxtQkFBb0IsOERBQTZEZ1Esa0JBQW1CO0FBSmhHO0FBTFUsSUFBM0I7O0FBYUEsUUFBTU0sWUFBWSxHQUFHLE1BQU1MLFNBQVMsRUFBcEM7QUFFQTtBQUNGO0FBQ0E7QUFDQTs7QUFDRSxNQUFJZixJQUFJLEdBQUcsRUFBWDtBQUVBO0FBQ0Y7QUFDQTtBQUNBOztBQUNFLE1BQUltQixhQUFKLEVBQW1CO0FBQ2pCLFVBQU07QUFBRXBCLE1BQUFBLEtBQUY7QUFBUzNHLE1BQUFBO0FBQVQsUUFBc0IsTUFBTWdJLFlBQVksQ0FBQ3lCLFVBQWIsQ0FBd0J0RixXQUF4QixDQUNoQzRELGFBRGdDLEVBRWhDbUIscUJBRmdDLENBQWxDOztBQUtBLFFBQUksQ0FBQ3ZDLEtBQUwsRUFBWTtBQUNWQyxNQUFBQSxJQUFJLEdBQUc1RyxRQUFRLENBQUMwSixZQUFoQjtBQUNBM0IsTUFBQUEsYUFBYSxHQUFHL0gsUUFBUSxDQUFDMkosUUFBekI7QUFDRCxLQUhELE1BR087QUFDTCxZQUFNLElBQUl6TSxLQUFKLENBQVV5SixLQUFWLENBQU47QUFDRDtBQUNGLEdBWkQsTUFZTztBQUNMLFVBQU07QUFBRUEsTUFBQUEsS0FBRjtBQUFTM0csTUFBQUE7QUFBVCxRQUFzQixNQUFNZ0ksWUFBWSxDQUFDeUIsVUFBYixDQUF3QjFGLFdBQXhCLENBQ2hDbUYscUJBRGdDLENBQWxDOztBQUlBLFFBQUksQ0FBQ3ZDLEtBQUwsRUFBWTtBQUNWQyxNQUFBQSxJQUFJLEdBQUc1RyxRQUFRLENBQUMwSixZQUFoQjtBQUNBM0IsTUFBQUEsYUFBYSxHQUFHL0gsUUFBUSxDQUFDMkosUUFBekI7QUFDRCxLQUhELE1BR087QUFDTCxZQUFNLElBQUl6TSxLQUFKLENBQVV5SixLQUFWLENBQU47QUFDRDtBQUNGO0FBRUQ7QUFDRjtBQUNBO0FBQ0E7OztBQUNFLFFBQU1wTyxXQUFXLENBQUNvQixNQUFaLENBQW1CdUssMkJBQW5CLENBQStDO0FBQ25EckosSUFBQUEsRUFBRSxFQUFFNk07QUFEK0MsR0FBL0MsQ0FBTixDQXpHeUUsQ0E2R3pFOztBQUNBLFFBQU1uUCxXQUFXLENBQUNvQixNQUFaLENBQW1Cc0IsTUFBbkIsQ0FBMEJ5TSxrQkFBMUIsa0NBQ0RuTyxNQURDO0FBRUpzTyxJQUFBQSxPQUFPLEVBQUUsQ0FDUDtBQUNFQyxNQUFBQSxRQUFRLEVBQUUsUUFEWjtBQUVFdk4sTUFBQUEsTUFBTSxFQUFFO0FBQ05pTSxRQUFBQSxPQUFPLEVBQUV1QjtBQURIO0FBRlYsS0FETztBQUZMLEtBQU47QUFZQSxTQUFPO0FBQ0xuQixJQUFBQSxJQURLO0FBRUxtQixJQUFBQSxhQUZLO0FBR0xMLElBQUFBO0FBSEssR0FBUDtBQUtELENBL0hEOzs7Ozs7Ozs7O0FDQUE3USxNQUFNLENBQUNDLE9BQVAsR0FBaUIsU0FBUzhTLDZCQUFULENBQXVDclEsTUFBdkMsRUFBK0M7QUFDOUQsUUFBTTtBQUFFcUosSUFBQUEsS0FBRjtBQUFTN0IsSUFBQUE7QUFBVCxNQUFrQnhILE1BQXhCO0FBRUEsUUFBTXNRLFlBQVksR0FBR2pILEtBQUssQ0FBQ3JCLEtBQU4sR0FBYyxHQUFuQztBQUVBLFNBQU87QUFDTHNJLElBQUFBLFlBREs7QUFFTEMsSUFBQUEsZ0JBQWdCLEVBQUVELFlBQVksR0FBR2pILEtBQUssQ0FBQ3BCLEdBQU4sR0FBWSxHQUZ4QztBQUdMdUksSUFBQUEsV0FBVyxFQUFFaEosSUFBSSxDQUFDZCxHQUFMLENBQ1gsQ0FBQztBQUNDZ0MsTUFBQUEsR0FERDtBQUVDZCxNQUFBQSxRQUZEO0FBR0NDLE1BQUFBLEtBSEQ7QUFJQ2xELE1BQUFBLElBSkQ7QUFLQ3dFLE1BQUFBLFNBTEQ7QUFNQ0MsTUFBQUEsZ0JBTkQ7QUFPQ2lELE1BQUFBO0FBUEQsS0FBRCxLQVFNO0FBQ0osWUFBTTtBQUFFckUsUUFBQUEsS0FBRjtBQUFTQyxRQUFBQSxHQUFUO0FBQWNDLFFBQUFBO0FBQWQsVUFBc0JMLEtBQTVCO0FBQ0EsWUFBTTRJLFVBQVUsR0FBR3pJLEtBQUssR0FBRyxHQUEzQjs7QUFFQSxVQUFJVSxHQUFHLENBQUNqRixVQUFKLENBQWUsYUFBZixDQUFKLEVBQW1DO0FBQ2pDLGVBQU87QUFDTGlOLFVBQUFBLFNBQVMsRUFBRWhJLEdBRE47QUFFTC9ELFVBQUFBLElBRks7QUFHTGlELFVBQUFBLFFBQVEsRUFBRSxDQUhMO0FBSUw2SSxVQUFBQSxVQUpLO0FBS0xFLFVBQUFBLFlBQVksRUFBRUYsVUFMVDtBQU1MRyxVQUFBQSxnQkFBZ0IsRUFBRSxDQU5iO0FBT0xDLFVBQUFBLFFBQVEsRUFBRSxDQVBMO0FBUUxuRSxVQUFBQSxJQUFJLEVBQUU7QUFSRCxTQUFQO0FBVUQ7O0FBRUQsWUFBTWlFLFlBQVksR0FBR0YsVUFBVSxHQUFHN0ksUUFBbEM7QUFDQSxZQUFNZ0osZ0JBQWdCLEdBQUdELFlBQVksR0FBRzFJLEdBQUcsR0FBR0wsUUFBTixHQUFpQixHQUF6RDtBQUVBLGFBQU87QUFDTGpELFFBQUFBLElBREs7QUFFTCtMLFFBQUFBLFNBQVMsRUFBRWhJLEdBRk47QUFHTCtILFFBQUFBLFVBSEs7QUFJTDdJLFFBQUFBLFFBSks7QUFLTCtJLFFBQUFBLFlBTEs7QUFNTEMsUUFBQUEsZ0JBTks7QUFPTGxFLFFBQUFBLElBQUksRUFBRSxVQVBEO0FBUUxtRSxRQUFBQSxRQUFRLEVBQUUzSSxHQUFHLENBQUN0RCxPQUFKLEdBQWMsR0FSbkI7QUFTTGtNLFFBQUFBLFNBQVMsRUFBRXpFLFFBVE47QUFVTDBFLFFBQUFBLGFBQWEsRUFBRWpGLElBQUksQ0FBQ0MsU0FBTCxDQUFlO0FBQzVCNUMsVUFBQUEsU0FENEI7QUFFNUJDLFVBQUFBLGdCQUY0QjtBQUc1QjRILFVBQUFBLFFBQVEsRUFBRTlJO0FBSGtCLFNBQWY7QUFWVixPQUFQO0FBZ0JELEtBN0NVO0FBSFIsR0FBUDtBQW1ERCxDQXhERDs7Ozs7Ozs7OztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBRUEsTUFBTWtELFNBQVMsR0FBR2hPLG1CQUFPLENBQUMsNEJBQUQsQ0FBekI7O0FBRUEsTUFBTXlSLGVBQWUsR0FBR3pRLE9BQU8sQ0FBQ0MsR0FBUixDQUFZd1EsZUFBcEM7QUFDQSxNQUFNQyxlQUFlLEdBQUcxUSxPQUFPLENBQUNDLEdBQVIsQ0FBWXlRLGVBQXBDO0FBRUEsSUFBSW1DLE1BQUo7QUFFQTNULE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmNlEsRUFBQUEsU0FBUyxFQUFFLE1BQU07QUFDZixVQUFNO0FBQUU4QyxNQUFBQTtBQUFGLFFBQWE5VCxtQkFBTyxDQUFDLDBEQUFELENBQTFCOztBQUVBZ08sSUFBQUEsU0FBUyxDQUFDeUQsZUFBRCxFQUFrQiw0Q0FBbEIsQ0FBVDtBQUNBekQsSUFBQUEsU0FBUyxDQUFDMEQsZUFBRCxFQUFrQiw0Q0FBbEIsQ0FBVDs7QUFFQSxRQUFJLENBQUNtQyxNQUFELElBQVdwQyxlQUFYLElBQThCQyxlQUFsQyxFQUFtRDtBQUNqRG1DLE1BQUFBLE1BQU0sR0FBRyxJQUFJQyxNQUFKLENBQVc7QUFDbEJDLFFBQUFBLFFBQVEsRUFBRXRDLGVBRFE7QUFFbEJ1QyxRQUFBQSxRQUFRLEVBQUV0QyxlQUZRO0FBR2xCdUMsUUFBQUEsV0FBVyxFQUFFO0FBSEssT0FBWCxDQUFUO0FBS0Q7O0FBRUQsV0FBT0osTUFBUDtBQUNEO0FBaEJjLENBQWpCOzs7Ozs7Ozs7Ozs7Ozs7O0FDWkEzVCxNQUFNLENBQUNDLE9BQVAsR0FBaUIsZUFBZStULG1CQUFmLENBQW1DO0FBQ2xEdkQsRUFBQUEsYUFEa0Q7QUFFbER0USxFQUFBQTtBQUZrRCxDQUFuQyxFQUdkO0FBQ0QsUUFBTXdCLGFBQWEsR0FBRzdCLG1CQUFPLENBQUMsb0VBQUQsQ0FBN0I7O0FBQ0EsUUFBTTRCLFdBQVcsR0FBRzVCLG1CQUFPLENBQUMsOERBQUQsQ0FBM0I7O0FBRUEsUUFBTTtBQUFFZ1IsSUFBQUE7QUFBRixNQUFnQmhSLG1CQUFPLENBQUMsaUVBQUQsQ0FBN0I7O0FBRUEsUUFBTTtBQUFFZ0wsSUFBQUEsV0FBRjtBQUFleUIsSUFBQUEsUUFBZjtBQUF5QnNGLElBQUFBO0FBQXpCLE1BQTZDcEIsYUFBbkQ7QUFDQSxRQUFNO0FBQUU1UCxJQUFBQSxtQkFBRjtBQUF1QlAsSUFBQUE7QUFBdkIsTUFBZ0NILE9BQXRDLENBUEMsQ0FTRDs7QUFDQSxRQUFNdVEsK0JBQStCLHFCQUNoQ25FLFFBRGdDLENBQXJDOztBQUdBLE1BQUlqTSxJQUFKLEVBQVU7QUFDUm9RLElBQUFBLCtCQUErQixDQUFDL0UsVUFBaEMsR0FBNkNyTCxJQUFJLENBQUNLLEtBQWxEO0FBQ0Q7O0FBRUQsUUFBTStCLE1BQU0sR0FBRyxNQUFNZixhQUFhLENBQUNpQixHQUFkLENBQWtCO0FBQUVrSSxJQUFBQSxXQUFGO0FBQWUzSyxJQUFBQTtBQUFmLEdBQWxCLENBQXJCO0FBQ0EsUUFBTTtBQUFFNEwsSUFBQUE7QUFBRixNQUFZckosTUFBbEI7QUFFQSxNQUFJO0FBQUVtTyxJQUFBQTtBQUFGLE1BQXlCL0YsV0FBN0I7QUFFQSxRQUFNbUosY0FBYyxHQUFHLEtBQXZCO0FBRUE7QUFDRjtBQUNBOztBQUNFLE1BQUlwRCxrQkFBSixFQUF3QjtBQUN0QixVQUFNblAsV0FBVyxDQUFDb0IsTUFBWixDQUFtQnNCLE1BQW5CLENBQTBCeU0sa0JBQTFCLGtDQUNEbk8sTUFEQztBQUVKNkosTUFBQUEsUUFBUSxFQUFFbUUsK0JBRk47QUFHSndELE1BQUFBLElBQUksRUFBRSxDQUNKO0FBQ0VDLFFBQUFBLEdBQUcsRUFBRSxnQkFEUDtBQUVFQyxRQUFBQSxLQUFLLEVBQUVILGNBQWMsR0FBRyxLQUFILEdBQVc7QUFGbEMsT0FESTtBQUhGLE9BQU47QUFVRCxHQVhELE1BV087QUFDTCxVQUFNdEQsZ0JBQWdCLEdBQUcsTUFBTWpQLFdBQVcsQ0FBQ29CLE1BQVosQ0FBbUI0SixNQUFuQixpQ0FDMUJoSyxNQUQwQjtBQUU3QjZKLE1BQUFBLFFBQVEsRUFBRW1FLCtCQUZtQjtBQUc3QndELE1BQUFBLElBQUksRUFBRSxDQUNKO0FBQ0VDLFFBQUFBLEdBQUcsRUFBRSxnQkFEUDtBQUVFQyxRQUFBQSxLQUFLLEVBQUVILGNBQWMsR0FBRyxLQUFILEdBQVc7QUFGbEMsT0FESTtBQUh1QixPQUEvQjtBQVVBcEQsSUFBQUEsa0JBQWtCLEdBQUdGLGdCQUFnQixDQUFDM00sRUFBdEM7QUFDRDs7QUFFRCxRQUFNcVEsWUFBWSxHQUFHLE1BQU12RCxTQUFTLEVBQXBDO0FBRUEsUUFBTXdELGNBQWMsR0FBRyxNQUFNRCxZQUFZLENBQUN0SCxTQUFiLENBQXVCTCxNQUF2QixDQUE4QjtBQUN6RHJGLElBQUFBLElBQUksRUFBRyxHQUFFa0YsUUFBUSxDQUFDMEMsU0FBVSxJQUFHMUMsUUFBUSxDQUFDMkMsUUFBUyxFQUEzQyxDQUE2Q3FGLElBQTdDLE1BQXVELFVBREo7QUFFekQ1VCxJQUFBQSxLQUFLLEVBQUU0TCxRQUFRLENBQUM0QyxTQUFULENBQW1CLENBQW5CLEVBQXNCeE87QUFGNEIsR0FBOUIsQ0FBN0I7QUFLQSxRQUFNcVIsWUFBWSxHQUFHLElBQUlDLEdBQUosQ0FDbkJKLGVBQWUsQ0FBQ0ssT0FBaEIsQ0FBd0Isc0JBQXhCLEVBQWdEckIsa0JBQWhELENBRG1CLENBQXJCO0FBSUEsUUFBTTJELGdCQUFnQixHQUFHO0FBQ3ZCaFAsSUFBQUEsTUFBTSxFQUFFO0FBQ05DLE1BQUFBLFFBQVEsRUFDTjNFLE9BQU8sQ0FBQ0MsR0FBUixDQUFZMFQsdUJBQVosSUFBdUMxSSxLQUFLLENBQUN0RyxRQUFOLENBQWVpUCxXQUFmLEVBRm5DO0FBR05OLE1BQUFBLEtBQUssRUFBRXJJLEtBQUssQ0FBQ3JCLEtBQU4sQ0FBWWhFLE9BQVosQ0FBb0IsQ0FBcEI7QUFIRCxLQURlO0FBTXZCaU8sSUFBQUEsVUFBVSxFQUFFTCxjQUFjLENBQUN0USxFQU5KO0FBT3ZCNFEsSUFBQUEsWUFBWSxFQUFFLE9BUFM7QUFRdkJDLElBQUFBLFdBQVcsRUFBRSx5QkFSVTtBQVN2QkMsSUFBQUEsV0FBVyxFQUFFOUMsWUFBWSxDQUFDVyxRQUFiLEVBVFU7QUFVdkJvQyxJQUFBQSxVQUFVLEVBQUcsR0FBRWxVLG1CQUFvQixpREFWWjtBQVd2Qm1VLElBQUFBLFFBQVEsRUFBRTtBQUFFbkUsTUFBQUE7QUFBRjtBQVhhLEdBQXpCO0FBY0EsUUFBTW9FLG1CQUFtQixHQUFHLE1BQU1aLFlBQVksQ0FBQ2EsUUFBYixDQUFzQnhJLE1BQXRCLENBQ2hDOEgsZ0JBRGdDLENBQWxDOztBQUlBLE1BQUlQLGNBQUosRUFBb0I7QUFDbEIsVUFBTUksWUFBWSxDQUFDYyxrQkFBYixDQUFnQ3ZTLEdBQWhDLENBQW9DcVMsbUJBQW1CLENBQUNHLFNBQXhELEVBQW1FO0FBQ3ZFVCxNQUFBQSxVQUFVLEVBQUVMLGNBQWMsQ0FBQ3RRO0FBRDRDLEtBQW5FLENBQU4sQ0FEa0IsQ0FLbEI7O0FBQ0EsVUFBTXFSLFNBQVMsR0FBRyxJQUFJQyxJQUFKLEVBQWxCO0FBQ0FELElBQUFBLFNBQVMsQ0FBQ0UsT0FBVixDQUFrQkYsU0FBUyxDQUFDRyxPQUFWLEtBQXNCLEVBQXhDO0FBQ0FILElBQUFBLFNBQVMsQ0FBQ0ksV0FBVixHQUF3QkMsS0FBeEIsQ0FBOEIsR0FBOUIsRUFBbUMsQ0FBbkM7QUFFQSxVQUFNckIsWUFBWSxDQUFDc0IsdUJBQWIsQ0FBcUNqSixNQUFyQyxDQUE0QztBQUNoRGlJLE1BQUFBLFVBQVUsRUFBRUwsY0FBYyxDQUFDdFEsRUFEcUI7QUFFaER3QixNQUFBQSxNQUFNLEVBQUVnUCxnQkFBZ0IsQ0FBQ2hQLE1BRnVCO0FBR2hEb1EsTUFBQUEsS0FBSyxFQUFFLENBSHlDO0FBSWhEQyxNQUFBQSxRQUFRLEVBQUUsU0FKc0M7QUFLaERSLE1BQUFBLFNBTGdEO0FBTWhEUixNQUFBQSxXQUFXLEVBQUUsMEJBTm1DO0FBT2hERSxNQUFBQSxVQUFVLEVBQUcsR0FBRWxVLG1CQUFvQix5REFQYTtBQVFoRG1VLE1BQUFBLFFBQVEsRUFBRTtBQVJzQyxLQUE1QyxDQUFOO0FBVUQ7O0FBRUQsU0FBTztBQUNMbkYsSUFBQUEsT0FBTyxFQUFFLElBREo7QUFFTGlHLElBQUFBLFlBQVksRUFBRWIsbUJBQW1CLENBQUNjLE1BQXBCLENBQTJCckQsUUFBM0IsQ0FBb0NzRCxJQUY3QztBQUdMbkYsSUFBQUE7QUFISyxHQUFQO0FBS0QsQ0EvR0Q7Ozs7Ozs7Ozs7QUNBQSxNQUFNO0FBQUVDLEVBQUFBO0FBQUYsSUFBZ0JoUixtQkFBTyxDQUFDLGlFQUFELENBQTdCOztBQUNBLE1BQU1tVyx1QkFBdUIsR0FBR25XLG1CQUFPLENBQUMsMkdBQUQsQ0FBdkM7O0FBQ0EsTUFBTThFLGFBQWEsR0FBRzlFLG1CQUFPLENBQUMsbUZBQUQsQ0FBN0I7O0FBRUFFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmb0MsRUFBQUEsT0FBTyxFQUFFeUUsT0FBTyxDQUFDaEcsT0FBTyxDQUFDQyxHQUFSLENBQVltVixjQUFiLENBREQ7QUFFZjVULEVBQUFBLGNBQWMsRUFBRSxFQUZEO0FBR2Z3TyxFQUFBQSxTQUhlO0FBSWZtRixFQUFBQSx1QkFKZTtBQUtmclIsRUFBQUE7QUFMZSxDQUFqQjs7Ozs7Ozs7OztBQ0pBO0FBQ0E7QUFDQTtBQUNBO0FBRUE1RSxNQUFNLENBQUNDLE9BQVAsR0FBaUIsU0FBU2tXLDZCQUFULENBQXVDO0FBQ3REQyxFQUFBQSxXQURzRDtBQUV0RDlCLEVBQUFBO0FBRnNELENBQXZDLEVBR2Q7QUFDRCxRQUFNK0IsWUFBWSxHQUFHL0IsY0FBYyxDQUFDak4sSUFBZixDQUFvQnFPLEtBQXBCLENBQTBCLEdBQTFCLENBQXJCO0FBRUEsU0FBTztBQUNMbkosSUFBQUEsUUFBUSxFQUFFO0FBQ1JaLE1BQUFBLFVBQVUsRUFBRTJJLGNBQWMsQ0FBQzNULEtBRG5CO0FBRVJzTyxNQUFBQSxTQUFTLEVBQUVvSCxZQUFZLENBQUMsQ0FBRCxDQUZmO0FBR1JDLE1BQUFBLFVBQVUsRUFBRUQsWUFBWSxDQUFDRSxLQUFiLENBQW1CLENBQW5CLEVBQXNCRixZQUFZLENBQUM1TyxNQUFiLEdBQXNCLENBQTVDLEVBQStDK08sSUFBL0MsRUFISjtBQUlSdEgsTUFBQUEsUUFBUSxFQUFFbUgsWUFBWSxDQUFDQSxZQUFZLENBQUM1TyxNQUFiLEdBQXNCLENBQXZCLENBSmQ7QUFLUmdQLE1BQUFBLFNBQVMsRUFBRW5CLElBTEg7QUFNUm5HLE1BQUFBLFNBQVMsRUFBRSxDQUNUO0FBQ0VDLFFBQUFBLElBQUksRUFBRSxTQURSO0FBRUVILFFBQUFBLFNBQVMsRUFBRW9ILFlBQVksQ0FBQyxDQUFELENBRnpCO0FBR0VDLFFBQUFBLFVBQVUsRUFBRUQsWUFBWSxDQUFDRSxLQUFiLENBQW1CLENBQW5CLEVBQXNCRixZQUFZLENBQUM1TyxNQUFiLEdBQXNCLENBQTVDLEVBQStDK08sSUFBL0MsRUFIZDtBQUlFdEgsUUFBQUEsUUFBUSxFQUFFbUgsWUFBWSxDQUFDQSxZQUFZLENBQUM1TyxNQUFiLEdBQXNCLENBQXZCLENBSnhCO0FBS0VpUCxRQUFBQSxNQUFNLEVBQUUsWUFMVjtBQU1FQyxRQUFBQSxPQUFPLEVBQUUsWUFOWDtBQU9FQyxRQUFBQSxVQUFVLEVBQUUsa0JBUGQ7QUFRRUMsUUFBQUEsSUFBSSxFQUFFLFdBUlI7QUFTRUMsUUFBQUEsS0FBSyxFQUFFLFlBVFQ7QUFVRUMsUUFBQUEsT0FBTyxFQUFFLGNBVlg7QUFXRUMsUUFBQUEsS0FBSyxFQUFFLFlBWFQ7QUFZRXJXLFFBQUFBLEtBQUssRUFBRTJULGNBQWMsQ0FBQzNUO0FBWnhCLE9BRFMsRUFlVDtBQUNFeU8sUUFBQUEsSUFBSSxFQUFFLFVBRFI7QUFFRUgsUUFBQUEsU0FBUyxFQUFFb0gsWUFBWSxDQUFDLENBQUQsQ0FGekI7QUFHRUMsUUFBQUEsVUFBVSxFQUFFRCxZQUFZLENBQUNFLEtBQWIsQ0FBbUIsQ0FBbkIsRUFBc0JGLFlBQVksQ0FBQzVPLE1BQWIsR0FBc0IsQ0FBNUMsRUFBK0MrTyxJQUEvQyxFQUhkO0FBSUV0SCxRQUFBQSxRQUFRLEVBQUVtSCxZQUFZLENBQUNBLFlBQVksQ0FBQzVPLE1BQWIsR0FBc0IsQ0FBdkIsQ0FKeEI7QUFLRWlQLFFBQUFBLE1BQU0sRUFBRSxZQUxWO0FBTUVDLFFBQUFBLE9BQU8sRUFBRSxZQU5YO0FBT0VDLFFBQUFBLFVBQVUsRUFBRSxrQkFQZDtBQVFFQyxRQUFBQSxJQUFJLEVBQUUsV0FSUjtBQVNFQyxRQUFBQSxLQUFLLEVBQUUsWUFUVDtBQVVFQyxRQUFBQSxPQUFPLEVBQUUsY0FWWDtBQVdFQyxRQUFBQSxLQUFLLEVBQUUsWUFYVDtBQVlFclcsUUFBQUEsS0FBSyxFQUFFMlQsY0FBYyxDQUFDM1Q7QUFaeEIsT0FmUztBQU5ILEtBREw7QUFzQ0xxUSxJQUFBQSxPQUFPLEVBQUUsQ0FDUDtBQUNFQyxNQUFBQSxRQUFRLEVBQUUsUUFEWjtBQUVFZ0csTUFBQUEsTUFBTSxFQUFFO0FBQ05DLFFBQUFBLFVBQVUsRUFBRSxDQUNWO0FBQ0VDLFVBQUFBLFFBQVEsRUFBRSxVQURaO0FBRUUvQyxVQUFBQSxLQUFLLEVBQUVnQyxXQUFXLENBQUNnQjtBQUZyQixTQURVLEVBS1Y7QUFDRUQsVUFBQUEsUUFBUSxFQUFFLGFBRFo7QUFFRS9DLFVBQUFBLEtBQUssRUFBRWdDLFdBQVcsQ0FBQ3BTO0FBRnJCLFNBTFUsRUFTVjtBQUNFbVQsVUFBQUEsUUFBUSxFQUFFLE1BRFo7QUFFRS9DLFVBQUFBLEtBQUssRUFBRWdDLFdBQVcsQ0FBQ2lCO0FBRnJCLFNBVFUsRUFhVjtBQUNFRixVQUFBQSxRQUFRLEVBQUUsUUFEWjtBQUVFL0MsVUFBQUEsS0FBSyxFQUFFZ0MsV0FBVyxDQUFDelg7QUFGckIsU0FiVSxFQWlCVjtBQUNFd1ksVUFBQUEsUUFBUSxFQUFFLFFBRFo7QUFFRS9DLFVBQUFBLEtBQUssRUFBRWdDLFdBQVcsQ0FBQ3hYO0FBRnJCLFNBakJVLEVBcUJWO0FBQ0V1WSxVQUFBQSxRQUFRLEVBQUUsV0FEWjtBQUVFL0MsVUFBQUEsS0FBSyxFQUFFZ0MsV0FBVyxDQUFDa0I7QUFGckIsU0FyQlUsRUF5QlY7QUFDRUgsVUFBQUEsUUFBUSxFQUFFLFdBRFo7QUFFRS9DLFVBQUFBLEtBQUssRUFBRWdDLFdBQVcsQ0FBQ2hCO0FBRnJCLFNBekJVLEVBNkJWO0FBQ0UrQixVQUFBQSxRQUFRLEVBQUUsWUFEWjtBQUVFL0MsVUFBQUEsS0FBSyxFQUFFZ0MsV0FBVyxDQUFDekI7QUFGckIsU0E3QlUsRUFpQ1Y7QUFDRXdDLFVBQUFBLFFBQVEsRUFBRSxjQURaO0FBRUUvQyxVQUFBQSxLQUFLLEVBQUVnQyxXQUFXLENBQUN4QjtBQUZyQixTQWpDVTtBQUROO0FBRlYsS0FETztBQXRDSixHQUFQO0FBb0ZELENBMUZEOzs7Ozs7Ozs7O0FDTEEsTUFBTTlHLFNBQVMsR0FBR2hPLG1CQUFPLENBQUMsNEJBQUQsQ0FBekI7O0FBRUEsTUFBTW9XLGNBQWMsR0FBR3BWLE9BQU8sQ0FBQ0MsR0FBUixDQUFZbVYsY0FBbkM7QUFFQSxJQUFJdkMsTUFBSjtBQUNBM1QsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2Y2USxFQUFBQSxTQUFTLEVBQUUsTUFBTTtBQUNmaEQsSUFBQUEsU0FBUyxDQUFDb0ksY0FBRCxFQUFpQiwyQ0FBakIsQ0FBVDs7QUFFQSxRQUFJLENBQUN2QyxNQUFMLEVBQWE7QUFDWCxZQUFNO0FBQUU0RCxRQUFBQTtBQUFGLFVBQXlCelgsbUJBQU8sQ0FBQyw4Q0FBRCxDQUF0Qzs7QUFDQTZULE1BQUFBLE1BQU0sR0FBRzRELGtCQUFrQixDQUFDO0FBQUVDLFFBQUFBLE1BQU0sRUFBRTFXLE9BQU8sQ0FBQ0MsR0FBUixDQUFZbVY7QUFBdEIsT0FBRCxDQUEzQjtBQUNEOztBQUVELFdBQU92QyxNQUFQO0FBQ0Q7QUFWYyxDQUFqQjs7Ozs7Ozs7OztBQ0xBLGVBQWV6TyxvQkFBZixDQUFvQztBQUFFdUwsRUFBQUEsYUFBRjtBQUFpQmQsRUFBQUEsT0FBakI7QUFBMEJ4UCxFQUFBQTtBQUExQixDQUFwQyxFQUF5RTtBQUN2RSxRQUFNc1gsaUJBQWlCLEdBQUczWCxtQkFBTyxDQUFDLGdFQUFELENBQWpDOztBQUVBLFFBQU00QixXQUFXLEdBQUc1QixtQkFBTyxDQUFDLDhEQUFELENBQTNCOztBQUNBLFFBQU02QixhQUFhLEdBQUc3QixtQkFBTyxDQUFDLG9FQUFELENBQTdCOztBQUNBLFFBQU07QUFBRStELElBQUFBLE1BQU0sRUFBRTZUO0FBQVYsTUFBMkI1WCxtQkFBTyxDQUFDLDZFQUFELENBQXhDOztBQUNBLFFBQU1tVyx1QkFBdUIsR0FBR25XLG1CQUFPLENBQUMsMkdBQUQsQ0FBdkM7O0FBRUEsTUFBSTtBQUNGLFVBQU07QUFBRWdMLE1BQUFBO0FBQUYsUUFBa0IyRixhQUF4QjtBQUNBLFVBQU0vTixNQUFNLEdBQUcsTUFBTWYsYUFBYSxDQUFDaUIsR0FBZCxDQUFrQjtBQUFFa0ksTUFBQUEsV0FBRjtBQUFlM0ssTUFBQUE7QUFBZixLQUFsQixDQUFyQjtBQUVBLFVBQU1nSixRQUFRLEdBQUcsTUFBTXVPLFlBQVksR0FBR0MsT0FBZixDQUNyQixJQUFJRixpQkFBaUIsQ0FBQzNVLE1BQWxCLENBQXlCOFUsZ0JBQTdCLENBQThDakksT0FBOUMsQ0FEcUIsQ0FBdkI7QUFJQSxVQUFNdkMsS0FBSyxHQUFHLE1BQU0xTCxXQUFXLENBQUNvQixNQUFaLENBQW1CNEosTUFBbkIsQ0FDbEJ1Six1QkFBdUIsQ0FBQ3ZULE1BQUQsRUFBU3lHLFFBQVEsQ0FBQzBPLE1BQWxCLENBREwsQ0FBcEI7QUFJQSxXQUFPO0FBQ0xoSSxNQUFBQSxPQUFPLEVBQUUsSUFESjtBQUVMRixNQUFBQSxPQUFPLEVBQUV2QyxLQUFLLENBQUNwSjtBQUZWLEtBQVA7QUFJRCxHQWhCRCxDQWdCRSxPQUFPOFQsR0FBUCxFQUFZO0FBQ1ozVSxJQUFBQSxPQUFPLENBQUMyTSxLQUFSLENBQWNnSSxHQUFkO0FBQ0Q7O0FBRUQsU0FBTztBQUNMakksSUFBQUEsT0FBTyxFQUFFO0FBREosR0FBUDtBQUdEOztBQUVEN1AsTUFBTSxDQUFDQyxPQUFQLEdBQWlCaUYsb0JBQWpCOzs7Ozs7Ozs7O0FDaENBLGVBQWVGLG1CQUFmLENBQW1DO0FBQUV5TCxFQUFBQSxhQUFGO0FBQWlCdFEsRUFBQUE7QUFBakIsQ0FBbkMsRUFBK0Q7QUFDN0QsUUFBTTBELE1BQU0sR0FBRy9ELG1CQUFPLENBQUMsZ0VBQUQsQ0FBdEI7O0FBRUEsUUFBTTtBQUFFK0QsSUFBQUEsTUFBTSxFQUFFNlQ7QUFBVixNQUEyQjVYLG1CQUFPLENBQUMsNkVBQUQsQ0FBeEM7O0FBQ0EsUUFBTTZCLGFBQWEsR0FBRzdCLG1CQUFPLENBQUMsb0VBQUQsQ0FBN0I7O0FBRUEsUUFBTTtBQUFFZ0wsSUFBQUE7QUFBRixNQUFrQjJGLGFBQXhCLENBTjZELENBUTdEOztBQUNBLFFBQU0vTixNQUFNLEdBQUcsTUFBTWYsYUFBYSxDQUFDaUIsR0FBZCxDQUFrQjtBQUFFa0ksSUFBQUEsV0FBRjtBQUFlM0ssSUFBQUE7QUFBZixHQUFsQixDQUFyQjtBQUVBLFFBQU00WCxPQUFPLEdBQUcsSUFBSWxVLE1BQU0sQ0FBQ2YsTUFBUCxDQUFja1YsbUJBQWxCLEVBQWhCLENBWDZELENBYTdEOztBQUNBRCxFQUFBQSxPQUFPLENBQUNFLE1BQVIsQ0FBZSx1QkFBZjtBQUVBRixFQUFBQSxPQUFPLENBQUNHLFdBQVIsQ0FBb0I7QUFDbEJDLElBQUFBLE1BQU0sRUFBRSxTQURVO0FBRWxCQyxJQUFBQSxjQUFjLEVBQUUsQ0FDZDtBQUNFNVMsTUFBQUEsTUFBTSxFQUFFO0FBQ042UyxRQUFBQSxhQUFhLEVBQUUzVixNQUFNLENBQUNxSixLQUFQLENBQWF0RyxRQUR0QjtBQUVOMk8sUUFBQUEsS0FBSyxFQUFFMVIsTUFBTSxDQUFDcUosS0FBUCxDQUFhckIsS0FBYixDQUFtQmlJLFFBQW5CO0FBRkQ7QUFEVixLQURjO0FBRkUsR0FBcEI7QUFZQSxNQUFJdkYsS0FBSjs7QUFDQSxNQUFJO0FBQ0ZBLElBQUFBLEtBQUssR0FBRyxNQUFNc0ssWUFBWSxHQUFHQyxPQUFmLENBQXVCSSxPQUF2QixDQUFkO0FBQ0QsR0FGRCxDQUVFLE9BQU9ELEdBQVAsRUFBWTtBQUNaM1UsSUFBQUEsT0FBTyxDQUFDMk0sS0FBUixDQUFjZ0ksR0FBZDtBQUNBLFdBQU87QUFBRWpJLE1BQUFBLE9BQU8sRUFBRTtBQUFYLEtBQVA7QUFDRDs7QUFFRCxTQUFPO0FBQ0xBLElBQUFBLE9BQU8sRUFBRSxJQURKO0FBRUxGLElBQUFBLE9BQU8sRUFBRXZDLEtBQUssQ0FBQ3lLLE1BQU4sQ0FBYTdUO0FBRmpCLEdBQVA7QUFJRDs7QUFFRGhFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQitFLG1CQUFqQjs7Ozs7Ozs7OztBQzNDQSxNQUFNQSxtQkFBbUIsR0FBR2xGLG1CQUFPLENBQUMsbUZBQUQsQ0FBbkM7O0FBQ0EsTUFBTW9GLG9CQUFvQixHQUFHcEYsbUJBQU8sQ0FBQyxxRkFBRCxDQUFwQzs7QUFFQSxNQUFNd1ksZ0JBQWdCLEdBQUd4WCxPQUFPLENBQUNDLEdBQVIsQ0FBWXVYLGdCQUFyQztBQUNBLE1BQU1DLG9CQUFvQixHQUFHelgsT0FBTyxDQUFDQyxHQUFSLENBQVl3WCxvQkFBekM7QUFFQXZZLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmb0MsRUFBQUEsT0FBTyxFQUFFeUUsT0FBTyxDQUFDd1IsZ0JBQWdCLElBQUlDLG9CQUFyQixDQUREO0FBRWZqVyxFQUFBQSxjQUFjLEVBQUU7QUFDZGtXLElBQUFBLFFBQVEsRUFBRUYsZ0JBREk7QUFFZDdTLElBQUFBLFFBQVEsRUFBRTtBQUZJLEdBRkQ7QUFNZlQsRUFBQUEsbUJBTmU7QUFPZkUsRUFBQUE7QUFQZSxDQUFqQjs7Ozs7Ozs7OztBQ05BLFNBQVM0TCxTQUFULEdBQXFCO0FBQ25CLFFBQU0yRyxpQkFBaUIsR0FBRzNYLG1CQUFPLENBQUMsZ0VBQUQsQ0FBakM7O0FBRUEsUUFBTTBZLFFBQVEsR0FBRzFYLE9BQU8sQ0FBQ0MsR0FBUixDQUFZdVgsZ0JBQVosSUFBZ0MsMEJBQWpEO0FBQ0EsUUFBTUcsWUFBWSxHQUNoQjNYLE9BQU8sQ0FBQ0MsR0FBUixDQUFZd1gsb0JBQVosSUFBb0MsOEJBRHRDLENBSm1CLENBT25CO0FBQ0E7QUFDQTtBQUNBOztBQUVBLFFBQU1HLFNBQVMsR0FBRyxJQUFJakIsaUJBQWlCLENBQUNrQixJQUFsQixDQUF1QkMsa0JBQTNCLENBQ2hCSixRQURnQixFQUVoQkMsWUFGZ0IsQ0FBbEI7QUFLQSxTQUFPLElBQUloQixpQkFBaUIsQ0FBQ2tCLElBQWxCLENBQXVCRSxnQkFBM0IsQ0FBNENILFNBQTVDLENBQVA7QUFDRDs7QUFFRDFZLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUFFNEQsRUFBQUEsTUFBTSxFQUFFaU47QUFBVixDQUFqQjs7Ozs7Ozs7OztBQ3BCQSxTQUFTbUYsdUJBQVQsQ0FBaUN2VCxNQUFqQyxFQUF5QzBLLEtBQXpDLEVBQWdEO0FBQUE7O0FBQzlDLFFBQU07QUFBRTBMLElBQUFBLEtBQUY7QUFBU1YsSUFBQUE7QUFBVCxNQUE0QmhMLEtBQWxDO0FBQ0EsUUFBTTtBQUFFMkwsSUFBQUE7QUFBRixNQUFlWCxjQUFjLENBQUMsQ0FBRCxDQUFuQztBQUNBLFFBQU07QUFBRVksSUFBQUE7QUFBRixNQUFjRCxRQUFwQjtBQUNBLFFBQU1wSixPQUFPLEdBQUd2QyxLQUFLLENBQUNwSixFQUF0QjtBQUVBO0FBQ0Y7QUFDQTs7QUFDRSxRQUFNMkgsVUFBVSxHQUFHeUIsS0FBSyxDQUFDMEwsS0FBTixDQUFZRyxhQUFaLElBQTZCN0wsS0FBSyxDQUFDMEwsS0FBTixDQUFZSSxRQUE1RDtBQUVBLFNBQU87QUFDTGhQLElBQUFBLElBQUksRUFBRXhILE1BQU0sQ0FBQ3dILElBRFI7QUFFTDZCLElBQUFBLEtBQUssRUFBRXJKLE1BQU0sQ0FBQ3FKLEtBRlQ7QUFHTGlGLElBQUFBLE9BQU8sRUFBRSxDQUNQO0FBQ0VDLE1BQUFBLFFBQVEsRUFBRSxRQURaO0FBRUVwTixNQUFBQSxNQUFNLEVBQUU7QUFDTjhMLFFBQUFBO0FBRE07QUFGVixLQURPLENBSEo7QUFXTHVFLElBQUFBLElBQUksRUFBRSxDQUNKO0FBQ0VDLE1BQUFBLEdBQUcsRUFBRSxxQkFEUDtBQUVFQyxNQUFBQSxLQUFLLEVBQUVoSCxLQUFLLENBQUN4TztBQUZmLEtBREksQ0FYRDtBQWlCTDJOLElBQUFBLFFBQVEsRUFBRTtBQUNSWixNQUFBQSxVQURRO0FBRVJzRCxNQUFBQSxTQUFTLEVBQUUsQ0FBQTZKLEtBQUssU0FBTCxJQUFBQSxLQUFLLFdBQUwsMkJBQUFBLEtBQUssQ0FBRXpSLElBQVAsNERBQWE4UixVQUFiLEtBQTJCLEVBRjlCO0FBR1I3QyxNQUFBQSxVQUFVLEVBQUUsRUFISjtBQUlScEgsTUFBQUEsUUFBUSxFQUFFLENBQUE0SixLQUFLLFNBQUwsSUFBQUEsS0FBSyxXQUFMLDRCQUFBQSxLQUFLLENBQUV6UixJQUFQLDhEQUFhK1IsT0FBYixLQUF3QixFQUoxQjtBQUtSakssTUFBQUEsU0FBUyxFQUFFLENBQ1Q7QUFDRUMsUUFBQUEsSUFBSSxFQUFFLFVBRFI7QUFFRUgsUUFBQUEsU0FBUyxFQUFFLENBQUE2SixLQUFLLFNBQUwsSUFBQUEsS0FBSyxXQUFMLDRCQUFBQSxLQUFLLENBQUV6UixJQUFQLDhEQUFhOFIsVUFBYixLQUEyQixFQUZ4QztBQUdFN0MsUUFBQUEsVUFBVSxFQUFFLEVBSGQ7QUFJRXBILFFBQUFBLFFBQVEsRUFBRSxDQUFBNEosS0FBSyxTQUFMLElBQUFBLEtBQUssV0FBTCw0QkFBQUEsS0FBSyxDQUFFelIsSUFBUCw4REFBYStSLE9BQWIsS0FBd0IsRUFKcEM7QUFLRTFDLFFBQUFBLE1BQU0sRUFBRXNDLE9BQUYsYUFBRUEsT0FBRix1QkFBRUEsT0FBTyxDQUFFSyxjQUxuQjtBQU1FMUMsUUFBQUEsT0FBTyxFQUFFLEVBTlg7QUFPRUMsUUFBQUEsVUFBVSxFQUFFLENBQUFvQyxPQUFPLFNBQVAsSUFBQUEsT0FBTyxXQUFQLFlBQUFBLE9BQU8sQ0FBRU0sV0FBVCxLQUF3QixFQVB0QztBQVFFekMsUUFBQUEsSUFBSSxFQUFFLENBQUFtQyxPQUFPLFNBQVAsSUFBQUEsT0FBTyxXQUFQLFlBQUFBLE9BQU8sQ0FBRU8sWUFBVCxLQUF5QixFQVJqQztBQVNFekMsUUFBQUEsS0FBSyxFQUFFLENBQUFrQyxPQUFPLFNBQVAsSUFBQUEsT0FBTyxXQUFQLFlBQUFBLE9BQU8sQ0FBRVEsWUFBVCxLQUF5QixFQVRsQztBQVVFekMsUUFBQUEsT0FBTyxFQUFFLENBQUFpQyxPQUFPLFNBQVAsSUFBQUEsT0FBTyxXQUFQLFlBQUFBLE9BQU8sQ0FBRVMsWUFBVCxLQUF5QixFQVZwQztBQVdFekMsUUFBQUEsS0FBSyxFQUFFLEVBWFQ7QUFZRXJXLFFBQUFBLEtBQUssRUFBRSxDQUFBbVksS0FBSyxTQUFMLElBQUFBLEtBQUssV0FBTCxZQUFBQSxLQUFLLENBQUVHLGFBQVAsS0FBd0I7QUFaakMsT0FEUztBQUxIO0FBakJMLEdBQVA7QUF3Q0Q7O0FBRURqWixNQUFNLENBQUNDLE9BQVAsR0FBaUJnVyx1QkFBakI7Ozs7Ozs7Ozs7QUNyREFqVyxNQUFNLENBQUNDLE9BQVAsR0FBaUIsZUFBZXVFLFlBQWYsQ0FBNEI7QUFDM0NrVixFQUFBQSxlQUQyQztBQUUzQ2pKLEVBQUFBLGFBRjJDO0FBRzNDdFEsRUFBQUE7QUFIMkMsQ0FBNUIsRUFJZDtBQUFBOztBQUNELFFBQU11QixXQUFXLEdBQUc1QixtQkFBTyxDQUFDLDhEQUFELENBQTNCOztBQUNBLFFBQU02QixhQUFhLEdBQUc3QixtQkFBTyxDQUFDLG9FQUFELENBQTdCOztBQUVBLFFBQU1tVyx1QkFBdUIsR0FBR25XLG1CQUFPLENBQUMsMkdBQUQsQ0FBdkM7O0FBRUEsUUFBTTtBQUFFZ0wsSUFBQUE7QUFBRixNQUFrQjJGLGFBQXhCO0FBQ0EsUUFBTTtBQUFFblEsSUFBQUE7QUFBRixNQUFXSCxPQUFqQjtBQUVBLFFBQU11QyxNQUFNLEdBQUcsTUFBTWYsYUFBYSxDQUFDaUIsR0FBZCxDQUFrQjtBQUFFa0ksSUFBQUEsV0FBRjtBQUFlM0ssSUFBQUE7QUFBZixHQUFsQixDQUFyQixDQVRDLENBV0Q7O0FBQ0EsUUFBTXdaLHFCQUFxQixHQUFHLE1BQU0xRCx1QkFBdUIsQ0FBQztBQUMxRHZULElBQUFBLE1BRDBEO0FBRTFEK04sSUFBQUEsYUFGMEQ7QUFHMURpSixJQUFBQSxlQUgwRDtBQUkxREUsSUFBQUEsa0JBQWtCLEVBQ2hCLENBQUF0WixJQUFJLFNBQUosSUFBQUEsSUFBSSxXQUFKLFlBQUFBLElBQUksQ0FBRUssS0FBTixNQUFlOFAsYUFBZixhQUFlQSxhQUFmLGdEQUFlQSxhQUFhLENBQUVsRSxRQUE5QixvRkFBZSxzQkFBeUI0QyxTQUF4QyxxRkFBZSx1QkFBcUMsQ0FBckMsQ0FBZiwyREFBZSx1QkFBeUN4TyxLQUF4RCxLQUFpRTtBQUxULEdBQUQsQ0FBM0Q7QUFRQTtBQUNGO0FBQ0E7QUFDQTtBQUNBOztBQUNFLFFBQU15TSxLQUFLLEdBQUcsTUFBTTFMLFdBQVcsQ0FBQ29CLE1BQVosQ0FBbUI0SixNQUFuQixDQUEwQmlOLHFCQUExQixDQUFwQjtBQUVBLFNBQU87QUFDTDlKLElBQUFBLE9BQU8sRUFBRSxJQURKO0FBRUxGLElBQUFBLE9BQU8sRUFBRXZDLEtBQUssQ0FBQ3BKO0FBRlYsR0FBUDtBQUlELENBbkNEOzs7Ozs7Ozs7O0FDQUFoRSxNQUFNLENBQUNDLE9BQVAsR0FBaUIsZUFBZXNFLG1CQUFmLENBQW1DO0FBQ2xEa00sRUFBQUEsYUFEa0Q7QUFFbERvSixFQUFBQSxPQUFPLEdBQUcsS0FGd0M7QUFHbERDLEVBQUFBLGVBSGtEO0FBSWxEM1osRUFBQUE7QUFKa0QsQ0FBbkMsRUFLZDtBQUNELFFBQU13QixhQUFhLEdBQUc3QixtQkFBTyxDQUFDLG9FQUFELENBQTdCOztBQUNBLFFBQU07QUFBRWdSLElBQUFBO0FBQUYsTUFBZ0JoUixtQkFBTyxDQUFDLGlFQUFELENBQTdCOztBQUVBLFFBQU07QUFBRWdMLElBQUFBO0FBQUYsTUFBa0IyRixhQUF4QjtBQUVBLFFBQU0vTixNQUFNLEdBQUcsTUFBTWYsYUFBYSxDQUFDaUIsR0FBZCxDQUFrQjtBQUFFa0ksSUFBQUEsV0FBRjtBQUFlM0ssSUFBQUE7QUFBZixHQUFsQixDQUFyQjtBQUVBLFFBQU00WixhQUFhLEdBQUcsTUFBTWpKLFNBQVMsR0FBR2tKLGNBQVosQ0FBMkJ0TixNQUEzQixDQUFrQztBQUM1RGxILElBQUFBLE1BQU0sRUFBRTlDLE1BQU0sQ0FBQ3FKLEtBQVAsQ0FBYXJCLEtBQWIsR0FBcUIsR0FEK0I7QUFFNURqRixJQUFBQSxRQUFRLEVBQUUvQyxNQUFNLENBQUNxSixLQUFQLENBQWF0RyxRQUZxQztBQUc1RG9VLElBQUFBLE9BSDREO0FBSTVESSxJQUFBQSxjQUFjLEVBQUVIO0FBSjRDLEdBQWxDLENBQTVCO0FBT0EsU0FBT0MsYUFBUDtBQUNELENBckJEOzs7Ozs7Ozs7O0FDQUEsTUFBTXhWLG1CQUFtQixHQUFHekUsbUJBQU8sQ0FBQyxpR0FBRCxDQUFuQzs7QUFDQSxNQUFNMEUsWUFBWSxHQUFHMUUsbUJBQU8sQ0FBQyxpRkFBRCxDQUE1Qjs7QUFFQSxNQUFNb2EsaUJBQWlCLEdBQUdwWixPQUFPLENBQUNDLEdBQVIsQ0FBWW1aLGlCQUF0QztBQUNBLE1BQU1DLHNCQUFzQixHQUFHclosT0FBTyxDQUFDQyxHQUFSLENBQVlvWixzQkFBM0M7QUFFQW5hLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmb0MsRUFBQUEsT0FBTyxFQUFFeUUsT0FBTyxDQUFDb1QsaUJBQWlCLElBQUlDLHNCQUF0QixDQUREO0FBR2Y7QUFDQTdYLEVBQUFBLGNBQWMsRUFBRTtBQUNkOFgsSUFBQUEsY0FBYyxFQUFFRDtBQURGLEdBSkQ7QUFPZjVWLEVBQUFBLG1CQVBlO0FBUWZDLEVBQUFBO0FBUmUsQ0FBakI7Ozs7Ozs7Ozs7QUNOQXhFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQixlQUFlb2EsNkJBQWYsQ0FBNkM7QUFDNUQzWCxFQUFBQSxNQUQ0RDtBQUU1RCtOLEVBQUFBLGFBRjREO0FBRzVEaUosRUFBQUEsZUFINEQ7QUFJNURFLEVBQUFBO0FBSjRELENBQTdDLEVBS2Q7QUFDRCxRQUFNO0FBQUU5SSxJQUFBQTtBQUFGLE1BQWdCaFIsbUJBQU8sQ0FBQyxpRUFBRCxDQUE3Qjs7QUFFQSxRQUFNaWEsYUFBYSxHQUFHLE1BQU1qSixTQUFTLEdBQUdrSixjQUFaLENBQTJCTSxRQUEzQixDQUMxQlosZUFEMEIsQ0FBNUI7QUFJQSxRQUFNO0FBQUVsUixJQUFBQTtBQUFGLE1BQVd1UixhQUFhLENBQUNRLE9BQS9CO0FBQ0EsUUFBTUMsTUFBTSxHQUFHaFMsSUFBSSxDQUFDLENBQUQsQ0FBbkI7QUFFQSxRQUFNNk4sWUFBWSxHQUFHbUUsTUFBTSxDQUFDQyxlQUFQLENBQXVCcFQsSUFBdkIsQ0FBNEJxTyxLQUE1QixDQUFrQyxHQUFsQyxDQUFyQjtBQUNBLE1BQUkvVSxLQUFLLEdBQUc2WixNQUFNLENBQUNFLGFBQW5COztBQUNBLE1BQUksQ0FBQy9aLEtBQUQsSUFBVThQLGFBQWEsQ0FBQ2xFLFFBQXhCLElBQW9Da0UsYUFBYSxDQUFDbEUsUUFBZCxDQUF1QjRDLFNBQS9ELEVBQTBFO0FBQ3hFLFVBQU13TCxnQkFBZ0IsR0FBR2xLLGFBQWEsQ0FBQ2xFLFFBQWQsQ0FBdUI0QyxTQUF2QixDQUFpQzVGLElBQWpDLENBQ3RCcVIsQ0FBRCxJQUFPLENBQUMsQ0FBQ0EsQ0FBQyxDQUFDamEsS0FEWSxDQUF6Qjs7QUFHQSxRQUFJZ2EsZ0JBQUosRUFBc0I7QUFDcEJoYSxNQUFBQSxLQUFLLEdBQUdnYSxnQkFBZ0IsQ0FBQ2hhLEtBQXpCO0FBQ0Q7QUFDRjs7QUFFRCxRQUFNdVQsSUFBSSxHQUFHLEVBQWI7O0FBQ0EsTUFBSTZGLGFBQWEsQ0FBQ3RHLGFBQWxCLEVBQWlDO0FBQy9CUyxJQUFBQSxJQUFJLENBQUN6QyxJQUFMLENBQVU7QUFDUjBDLE1BQUFBLEdBQUcsRUFBRSxvQkFERztBQUVSQyxNQUFBQSxLQUFLLEVBQUU1RixJQUFJLENBQUNDLFNBQUwsQ0FBZXNMLGFBQWEsQ0FBQ3RHLGFBQTdCO0FBRkMsS0FBVjtBQUlEOztBQUVELFNBQU87QUFDTHZKLElBQUFBLElBQUksRUFBRXhILE1BQU0sQ0FBQ3dILElBRFI7QUFFTDZCLElBQUFBLEtBQUssRUFBRXJKLE1BQU0sQ0FBQ3FKLEtBRlQ7QUFHTG1JLElBQUFBLElBSEs7QUFJTDNILElBQUFBLFFBQVEsRUFBRTtBQUNSWixNQUFBQSxVQUFVLEVBQUVpTyxrQkFESjtBQUVSM0ssTUFBQUEsU0FBUyxFQUFFb0gsWUFBWSxDQUFDLENBQUQsQ0FGZjtBQUdSQyxNQUFBQSxVQUFVLEVBQUVELFlBQVksQ0FBQ0UsS0FBYixDQUFtQixDQUFuQixFQUFzQkYsWUFBWSxDQUFDNU8sTUFBYixHQUFzQixDQUE1QyxFQUErQytPLElBQS9DLEVBSEo7QUFJUnRILE1BQUFBLFFBQVEsRUFBRW1ILFlBQVksQ0FBQ0EsWUFBWSxDQUFDNU8sTUFBYixHQUFzQixDQUF2QixDQUpkO0FBS1JnUCxNQUFBQSxTQUFTLEVBQUVuQixJQUxIO0FBTVJuRyxNQUFBQSxTQUFTLEVBQUUsQ0FDVDtBQUNFQyxRQUFBQSxJQUFJLEVBQUUsU0FEUjtBQUVFSCxRQUFBQSxTQUFTLEVBQUVvSCxZQUFZLENBQUMsQ0FBRCxDQUZ6QjtBQUdFQyxRQUFBQSxVQUFVLEVBQUVELFlBQVksQ0FBQ0UsS0FBYixDQUFtQixDQUFuQixFQUFzQkYsWUFBWSxDQUFDNU8sTUFBYixHQUFzQixDQUE1QyxFQUErQytPLElBQS9DLEVBSGQ7QUFJRXRILFFBQUFBLFFBQVEsRUFBRW1ILFlBQVksQ0FBQ0EsWUFBWSxDQUFDNU8sTUFBYixHQUFzQixDQUF2QixDQUp4QjtBQUtFaVAsUUFBQUEsTUFBTSxFQUFFOEQsTUFBTSxDQUFDQyxlQUFQLENBQXVCekIsT0FBdkIsQ0FBK0I2QixLQUx6QztBQU1FbEUsUUFBQUEsT0FBTyxFQUFFNkQsTUFBTSxDQUFDQyxlQUFQLENBQXVCekIsT0FBdkIsQ0FBK0I4QixLQU4xQztBQU9FbEUsUUFBQUEsVUFBVSxFQUFFNEQsTUFBTSxDQUFDQyxlQUFQLENBQXVCekIsT0FBdkIsQ0FBK0JNLFdBUDdDO0FBUUV6QyxRQUFBQSxJQUFJLEVBQUUyRCxNQUFNLENBQUNDLGVBQVAsQ0FBdUJ6QixPQUF2QixDQUErQm5DLElBUnZDO0FBU0VDLFFBQUFBLEtBQUssRUFBRTBELE1BQU0sQ0FBQ0MsZUFBUCxDQUF1QnpCLE9BQXZCLENBQStCbEMsS0FUeEM7QUFVRUMsUUFBQUEsT0FBTyxFQUFFeUQsTUFBTSxDQUFDQyxlQUFQLENBQXVCekIsT0FBdkIsQ0FBK0JqQyxPQVYxQztBQVdFQyxRQUFBQSxLQUFLLEVBQUV3RCxNQUFNLENBQUNDLGVBQVAsQ0FBdUJ6RCxLQVhoQztBQVlFclcsUUFBQUE7QUFaRixPQURTLEVBZVQ7QUFDRXlPLFFBQUFBLElBQUksRUFBRSxVQURSO0FBRUVILFFBQUFBLFNBQVMsRUFBRW9ILFlBQVksQ0FBQyxDQUFELENBRnpCO0FBR0VDLFFBQUFBLFVBQVUsRUFBRUQsWUFBWSxDQUFDRSxLQUFiLENBQW1CLENBQW5CLEVBQXNCRixZQUFZLENBQUM1TyxNQUFiLEdBQXNCLENBQTVDLEVBQStDK08sSUFBL0MsRUFIZDtBQUlFdEgsUUFBQUEsUUFBUSxFQUFFbUgsWUFBWSxDQUFDQSxZQUFZLENBQUM1TyxNQUFiLEdBQXNCLENBQXZCLENBSnhCO0FBS0VpUCxRQUFBQSxNQUFNLEVBQUU4RCxNQUFNLENBQUNDLGVBQVAsQ0FBdUJ6QixPQUF2QixDQUErQjZCLEtBTHpDO0FBTUVsRSxRQUFBQSxPQUFPLEVBQUU2RCxNQUFNLENBQUNDLGVBQVAsQ0FBdUJ6QixPQUF2QixDQUErQjhCLEtBTjFDO0FBT0VsRSxRQUFBQSxVQUFVLEVBQUU0RCxNQUFNLENBQUNDLGVBQVAsQ0FBdUJ6QixPQUF2QixDQUErQk0sV0FQN0M7QUFRRXpDLFFBQUFBLElBQUksRUFBRTJELE1BQU0sQ0FBQ0MsZUFBUCxDQUF1QnpCLE9BQXZCLENBQStCbkMsSUFSdkM7QUFTRUMsUUFBQUEsS0FBSyxFQUFFMEQsTUFBTSxDQUFDQyxlQUFQLENBQXVCekIsT0FBdkIsQ0FBK0JsQyxLQVR4QztBQVVFQyxRQUFBQSxPQUFPLEVBQUV5RCxNQUFNLENBQUNDLGVBQVAsQ0FBdUJ6QixPQUF2QixDQUErQmpDLE9BVjFDO0FBV0VDLFFBQUFBLEtBQUssRUFBRXdELE1BQU0sQ0FBQ0MsZUFBUCxDQUF1QnpELEtBWGhDO0FBWUVyVyxRQUFBQTtBQVpGLE9BZlM7QUFOSCxLQUpMO0FBeUNMcVEsSUFBQUEsT0FBTyxFQUFFLENBQ1A7QUFDRUMsTUFBQUEsUUFBUSxFQUFFLFFBRFo7QUFFRXhOLE1BQUFBLE1BQU0sRUFBRTtBQUNOQSxRQUFBQSxNQUFNLEVBQUUrVyxNQUFNLENBQUN4VyxFQURUO0FBRU4yUSxRQUFBQSxVQUFVLEVBQUU2RixNQUFNLENBQUNqTyxRQUZiO0FBR05vRCxRQUFBQSxPQUFPLEVBQUU2SyxNQUFNLENBQUNPLGNBSFY7QUFJTkMsUUFBQUEsYUFBYSxFQUFFUixNQUFNLENBQUNTLHNCQUFQLENBQThCN0wsSUFKdkM7QUFLTjBLLFFBQUFBLGVBQWUsRUFBRVUsTUFBTSxDQUFDUCxjQUxsQjtBQU1OUCxRQUFBQSxlQUFlLEVBQUVjLE1BQU0sQ0FBQ08sY0FObEI7QUFPTkcsUUFBQUEsY0FBYyxFQUFFVixNQUFNLENBQUNXLFlBUGpCO0FBUU5uRyxRQUFBQSxRQUFRLEVBQUU7QUFSSjtBQUZWLEtBRE87QUF6Q0osR0FBUDtBQXlERCxDQTNGRDs7Ozs7Ozs7OztBQ0FBLE1BQU1sSCxTQUFTLEdBQUdoTyxtQkFBTyxDQUFDLDRCQUFELENBQXpCOztBQUVBLE1BQU1vYSxpQkFBaUIsR0FBR3BaLE9BQU8sQ0FBQ0MsR0FBUixDQUFZbVosaUJBQXRDO0FBRUEsSUFBSXZHLE1BQUo7QUFDQTNULE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQjtBQUNmNlEsRUFBQUEsU0FBUyxFQUFFLE1BQU07QUFDZmhELElBQUFBLFNBQVMsQ0FDUG9NLGlCQURPLEVBRVAsOENBRk8sQ0FBVDs7QUFLQSxRQUFJLENBQUN2RyxNQUFMLEVBQWE7QUFDWCxZQUFNeUgsU0FBUyxHQUFHdGIsbUJBQU8sQ0FBQyxzQkFBRCxDQUF6Qjs7QUFDQTZULE1BQUFBLE1BQU0sR0FBR3lILFNBQVMsQ0FBQ2xCLGlCQUFELENBQWxCO0FBQ0Q7O0FBRUQsV0FBT3ZHLE1BQVA7QUFDRDtBQWJjLENBQWpCOzs7Ozs7Ozs7O0FDTEEzVCxNQUFNLENBQUNDLE9BQVAsR0FBaUIsZUFBZW9iLGFBQWYsQ0FBNkI7QUFDNUN4SyxFQUFBQSxrQkFENEM7QUFFNUN5SyxFQUFBQSxZQUY0QztBQUc1Q0MsRUFBQUE7QUFINEMsQ0FBN0IsRUFJZDtBQUNELFFBQU03WixXQUFXLEdBQUc1QixtQkFBTyxDQUFDLDhEQUFELENBQTNCOztBQUVBLFFBQU07QUFBRWdSLElBQUFBO0FBQUYsTUFBZ0JoUixtQkFBTyxDQUFDLGdFQUFELENBQTdCOztBQUVBLE1BQUkwYixVQUFVLEdBQUcsRUFBakI7QUFFQSxRQUFNQyxXQUFXLEdBQUcsTUFBTTNLLFNBQVMsRUFBbkMsQ0FQQyxDQVNEOztBQUNBLFFBQU0xRCxLQUFLLEdBQUcsTUFBTXFPLFdBQVcsQ0FBQ0MsZUFBWixDQUE0QjtBQUM5Qy9MLElBQUFBLE9BQU8sRUFBRWtCO0FBRHFDLEdBQTVCLENBQXBCO0FBR0EsUUFBTSxDQUFDOEssdUJBQUQsSUFBNEJ2TyxLQUFLLENBQUN3TyxxQkFBTixDQUE0QkMsSUFBNUIsQ0FDaEMsQ0FBQ2pCLENBQUQsRUFBSWtCLENBQUosS0FBVSxJQUFJeEcsSUFBSixDQUFTd0csQ0FBQyxDQUFDQyxTQUFYLElBQXdCLElBQUl6RyxJQUFKLENBQVNzRixDQUFDLENBQUNtQixTQUFYLENBREYsQ0FBbEM7QUFJQTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBQ0UsTUFDRUosdUJBQXVCLENBQUNLLFNBQXhCLEtBQXNDLFNBQXRDLElBQ0FMLHVCQUF1QixDQUFDTSxnQkFGMUIsRUFHRTtBQUNBVCxJQUFBQSxVQUFVLEdBQUdGLFlBQWI7QUFFQTtBQUNKO0FBQ0E7QUFDQTs7QUFDSSxVQUFNO0FBQ0pZLE1BQUFBLFdBQVcsRUFBRTtBQUNYQyxRQUFBQSxNQURXO0FBRVhsTixRQUFBQSxTQUZXO0FBR1hDLFFBQUFBLFFBSFc7QUFJWHZPLFFBQUFBLEtBSlc7QUFLWHliLFFBQUFBLFlBQVksRUFBRXBGO0FBTEgsVUFNVCxFQVBBO0FBUUpxRixNQUFBQSxlQUFlLEVBQUU7QUFDZnJELFFBQUFBLE9BQU8sRUFBRTtBQUNQc0QsVUFBQUEsWUFBWSxFQUFFNUYsTUFEUDtBQUVQNkYsVUFBQUEsWUFBWSxFQUFFNUYsT0FGUDtBQUdQNkYsVUFBQUEsUUFBUSxFQUFFNUYsVUFISDtBQUlQQyxVQUFBQSxJQUpPO0FBS1BFLFVBQUFBO0FBTE8sWUFNTDtBQVBXLFVBUWI7QUFoQkEsUUFpQkYzSixLQWpCSjtBQW1CQSxVQUFNMUwsV0FBVyxDQUFDb0IsTUFBWixDQUFtQnNCLE1BQW5CLENBQTBCeU0sa0JBQTFCLEVBQThDO0FBQ2xERyxNQUFBQSxPQUFPLEVBQUUsQ0FDUDtBQUNFQyxRQUFBQSxRQUFRLEVBQUUsUUFEWjtBQUVFZ0csUUFBQUEsTUFBTSxFQUFFO0FBQ05DLFVBQUFBLFVBQVUsRUFBRSxDQUNWO0FBQ0VDLFlBQUFBLFFBQVEsRUFBRSxpQkFEWjtBQUVFL0MsWUFBQUEsS0FBSyxFQUFFO0FBRlQsV0FEVSxFQUtWO0FBQ0UrQyxZQUFBQSxRQUFRLEVBQUUsZUFEWjtBQUVFL0MsWUFBQUEsS0FBSyxFQUFFdkQ7QUFGVCxXQUxVLEVBU1Y7QUFDRXNHLFlBQUFBLFFBQVEsRUFBRSxjQURaO0FBRUUvQyxZQUFBQSxLQUFLLEVBQUUrSDtBQUZULFdBVFU7QUFETjtBQUZWLE9BRE8sQ0FEeUM7QUFzQmxENVAsTUFBQUEsUUFBUSxFQUFFO0FBQ1JaLFFBQUFBLFVBQVUsRUFBRWhMLEtBREo7QUFFUnNPLFFBQUFBLFNBRlE7QUFHUkMsUUFBQUEsUUFIUTtBQUlSQyxRQUFBQSxTQUFTLEVBQUUsQ0FDVDtBQUNFQyxVQUFBQSxJQUFJLEVBQUUsVUFEUjtBQUVFek8sVUFBQUEsS0FGRjtBQUdFc08sVUFBQUEsU0FIRjtBQUlFQyxVQUFBQSxRQUpGO0FBS0U4SCxVQUFBQSxLQUxGO0FBTUVOLFVBQUFBLE1BTkY7QUFPRUMsVUFBQUEsT0FQRjtBQVFFQyxVQUFBQSxVQVJGO0FBU0VDLFVBQUFBLElBVEY7QUFVRUUsVUFBQUE7QUFWRixTQURTO0FBSkg7QUF0QndDLEtBQTlDLENBQU47QUEwQ0QsR0F2RUQsTUF1RU87QUFDTHlFLElBQUFBLFVBQVUsR0FBR0QsVUFBYjtBQUNBcFksSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQVlvTCxJQUFJLENBQUNDLFNBQUwsQ0FBZWtOLHVCQUFmLEVBQXdDLElBQXhDLEVBQThDLENBQTlDLENBQVo7QUFDRDs7QUFFRCxTQUFPO0FBQ0xILElBQUFBO0FBREssR0FBUDtBQUdELENBMUdEOzs7Ozs7Ozs7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBRUEsTUFBTWlCLGVBQWUsR0FBRzNiLE9BQU8sQ0FBQ0MsR0FBUixDQUFZMGIsZUFBcEM7QUFDQSxNQUFNQyxtQkFBbUIsR0FBRzViLE9BQU8sQ0FBQ0MsR0FBUixDQUFZMmIsbUJBQXhDO0FBQ0EsTUFBTUMscUJBQXFCLEdBQUc3YixPQUFPLENBQUNDLEdBQVIsQ0FBWTRiLHFCQUExQztBQUNBLE1BQU1DLGFBQWEsR0FBRzliLE9BQU8sQ0FBQ0MsR0FBUixDQUFZNmIsYUFBbEM7O0FBRUEsTUFBTTlYLGVBQWUsR0FBR2hGLG1CQUFPLENBQUMsc0ZBQUQsQ0FBL0I7O0FBQ0EsTUFBTStjLFFBQVEsR0FBRy9jLG1CQUFPLENBQUMsc0VBQUQsQ0FBeEI7O0FBQ0EsTUFBTWdkLFdBQVcsR0FBR2hkLG1CQUFPLENBQUMsOEVBQUQsQ0FBM0I7O0FBQ0EsTUFBTWlkLGtCQUFrQixHQUFHamQsbUJBQU8sQ0FBQyw4RkFBRCxDQUFsQzs7QUFFQUUsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2ZvQyxFQUFBQSxPQUFPLEVBQUV5RSxPQUFPLENBQ2QyVixlQUFlLElBQ2JDLG1CQURGLElBRUVDLHFCQUZGLElBR0VDLGFBSlksQ0FERDtBQU9mdGEsRUFBQUEsY0FBYyxFQUFFLEVBUEQ7QUFRZndDLEVBQUFBLGVBUmU7QUFTZitYLEVBQUFBLFFBVGU7QUFVZkMsRUFBQUEsV0FWZTtBQVdmQyxFQUFBQTtBQVhlLENBQWpCOzs7Ozs7Ozs7Ozs7Ozs7O0FDakJBLE1BQU1qUCxTQUFTLEdBQUdoTyxtQkFBTyxDQUFDLDRCQUFELENBQXpCOztBQUVBLE1BQU02YyxxQkFBcUIsR0FBRzdiLE9BQU8sQ0FBQ0MsR0FBUixDQUFZNGIscUJBQTFDOztBQUVBM2MsTUFBTSxDQUFDQyxPQUFQLEdBQWlCLGVBQWUrYyxvQkFBZixDQUFvQztBQUNuRHZNLEVBQUFBLGFBRG1EO0FBRW5EdFEsRUFBQUE7QUFGbUQsQ0FBcEMsRUFHZDtBQUNELFFBQU13QixhQUFhLEdBQUc3QixtQkFBTyxDQUFDLG9FQUFELENBQTdCOztBQUNBLFFBQU00QixXQUFXLEdBQUc1QixtQkFBTyxDQUFDLDhEQUFELENBQTNCOztBQUVBLFFBQU07QUFBRWdSLElBQUFBO0FBQUYsTUFBZ0JoUixtQkFBTyxDQUFDLGdFQUFELENBQTdCOztBQUVBZ08sRUFBQUEsU0FBUyxDQUNQNk8scUJBRE8sRUFFUCxnREFGTyxDQUFUO0FBS0EsUUFBTTtBQUFFN1IsSUFBQUEsV0FBRjtBQUFleUIsSUFBQUEsUUFBZjtBQUF5QnNGLElBQUFBLGVBQXpCO0FBQTBDRSxJQUFBQTtBQUExQyxNQUEwRHRCLGFBQWhFO0FBQ0EsUUFBTTtBQUFFNVAsSUFBQUEsbUJBQUY7QUFBdUJQLElBQUFBO0FBQXZCLE1BQWdDSCxPQUF0QyxDQVpDLENBY0Q7O0FBQ0EsUUFBTXVRLCtCQUErQixxQkFDaENuRSxRQURnQyxDQUFyQzs7QUFHQSxNQUFJak0sSUFBSixFQUFVO0FBQ1JvUSxJQUFBQSwrQkFBK0IsQ0FBQy9FLFVBQWhDLEdBQTZDckwsSUFBSSxDQUFDSyxLQUFsRDtBQUNEOztBQUVELFFBQU0rQixNQUFNLEdBQUcsTUFBTWYsYUFBYSxDQUFDaUIsR0FBZCxDQUFrQjtBQUFFa0ksSUFBQUEsV0FBRjtBQUFlM0ssSUFBQUE7QUFBZixHQUFsQixDQUFyQjtBQUNBLFFBQU07QUFBRTRMLElBQUFBO0FBQUYsTUFBWXJKLE1BQWxCO0FBRUE7QUFDRjtBQUNBOztBQUNFLFFBQU1pTyxnQkFBZ0IsR0FBRyxNQUFNalAsV0FBVyxDQUFDb0IsTUFBWixDQUFtQjRKLE1BQW5CLGlDQUMxQmhLLE1BRDBCO0FBRTdCNkosSUFBQUEsUUFBUSxFQUFFbUU7QUFGbUIsS0FBL0I7QUFJQSxRQUFNRyxrQkFBa0IsR0FBR0YsZ0JBQWdCLENBQUMzTSxFQUE1QztBQUVBO0FBQ0Y7QUFDQTtBQUNBOztBQUNFLFFBQU1pWixXQUFXLEdBQUcsSUFBSWhMLEdBQUosQ0FDakIsR0FBRXBSLG1CQUFvQiw4Q0FBNkNnUSxrQkFBbUIsRUFEckUsQ0FBcEI7QUFHQW9NLEVBQUFBLFdBQVcsQ0FBQzlLLFlBQVosQ0FBeUJDLE1BQXpCLENBQ0UsY0FERixFQUVFOEssa0JBQWtCLENBQ2hCckwsZUFBZSxDQUFDSyxPQUFoQixDQUF3QixzQkFBeEIsRUFBZ0RyQixrQkFBaEQsQ0FEZ0IsQ0FGcEI7QUFNQW9NLEVBQUFBLFdBQVcsQ0FBQzlLLFlBQVosQ0FBeUJDLE1BQXpCLENBQWdDLFVBQWhDLEVBQTRDOEssa0JBQWtCLENBQUNuTCxXQUFELENBQTlEO0FBRUEsUUFBTTBKLFdBQVcsR0FBRyxNQUFNM0ssU0FBUyxFQUFuQztBQUVBLFFBQU1xTSxhQUFhLEdBQUcsTUFBTTFCLFdBQVcsQ0FBQzNXLGVBQVosQ0FBNEI7QUFDdERzSSxJQUFBQSxLQUFLLEVBQUU7QUFDTGdRLE1BQUFBLFlBQVksRUFBRTtBQUNaQyxRQUFBQSxvQkFBb0IsRUFBRVYscUJBRFY7QUFFWlcsUUFBQUEsUUFBUSxFQUFFTCxXQUFXLENBQUN0SyxRQUFaLEVBRkU7QUFHWjRLLFFBQUFBLGNBQWMsRUFBRyxHQUFFMWMsbUJBQW9CLGdEQUgzQjtBQUlaMmMsUUFBQUEscUJBQXFCLEVBQUcsR0FBRTNjLG1CQUFvQiw0Q0FKbEM7QUFLWjRjLFFBQUFBLG9CQUFvQixFQUFHLEdBQUU1YyxtQkFBb0Isb0RBTGpDO0FBTVo2YyxRQUFBQSxXQUFXLEVBQUUsdUJBTkQ7QUFPWkMsUUFBQUEsS0FBSyxFQUFFLEtBUEs7QUFRWkMsUUFBQUEscUJBQXFCLEVBQUUsQ0FDckI7QUFDQTtBQUNFQyxVQUFBQSxTQUFTLEVBQUUsR0FEYjtBQUVFQyxVQUFBQSxRQUFRLEVBQUUsQ0FGWjtBQUdFQyxVQUFBQSxZQUFZLEVBQUUsQ0FIaEI7QUFJRUMsVUFBQUEsY0FBYyxFQUFFLHFCQUpsQjtBQUtFQyxVQUFBQSxnQkFBZ0IsRUFBRTtBQUxwQixTQUZxQjtBQVJYLE9BRFQ7QUFvQkxDLE1BQUFBLFlBQVksRUFBRSxFQXBCVDtBQXFCTEMsTUFBQUEsV0FBVyxFQUFFO0FBQ1h4TyxRQUFBQSxPQUFPLEVBQUVrQixrQkFERTtBQUVYckwsUUFBQUEsTUFBTSxFQUFFbkMsUUFBUSxDQUFDMEksS0FBSyxDQUFDckIsS0FBTixHQUFjLEdBQWYsRUFBb0IsRUFBcEIsQ0FGTDtBQUdYMFQsUUFBQUEsZUFBZSxFQUFFO0FBSE47QUFyQlI7QUFEK0MsR0FBNUIsQ0FBNUI7QUE4QkEsU0FBTztBQUNMdk8sSUFBQUEsT0FBTyxFQUFFLElBREo7QUFFTGlHLElBQUFBLFlBQVksRUFBRXFILGFBQWEsQ0FBQ25PLEdBRnZCO0FBR0w2QixJQUFBQTtBQUhLLEdBQVA7QUFLRCxDQXpGRDs7Ozs7Ozs7OztBQ0pBN1EsTUFBTSxDQUFDQyxPQUFQLEdBQWlCLGVBQWVvZSxnQkFBZixDQUFnQztBQUFFeE4sRUFBQUE7QUFBRixDQUFoQyxFQUF3RDtBQUN2RTFOLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLG9CQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZO0FBQUV5TixJQUFBQTtBQUFGLEdBQVosRUFGdUUsQ0FJdkU7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0QsQ0FYRDs7Ozs7Ozs7OztBQ0FBN1EsTUFBTSxDQUFDQyxPQUFQLEdBQWlCLGVBQWVxZSx1QkFBZixDQUF1QztBQUFFQyxFQUFBQTtBQUFGLENBQXZDLEVBQXdEO0FBQ3ZFO0FBQ0E7QUFFQXBiLEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZLDRCQUFaO0FBQ0FELEVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZO0FBQUVtYixJQUFBQTtBQUFGLEdBQVo7QUFDRCxDQU5EOzs7Ozs7Ozs7O0FDQUEsTUFBTXpRLFNBQVMsR0FBR2hPLG1CQUFPLENBQUMsNEJBQUQsQ0FBekI7O0FBRUEsTUFBTTJjLGVBQWUsR0FBRzNiLE9BQU8sQ0FBQ0MsR0FBUixDQUFZMGIsZUFBcEM7QUFDQSxNQUFNQyxtQkFBbUIsR0FBRzViLE9BQU8sQ0FBQ0MsR0FBUixDQUFZMmIsbUJBQXhDO0FBQ0EsTUFBTUUsYUFBYSxHQUFHOWIsT0FBTyxDQUFDQyxHQUFSLENBQVk2YixhQUFsQztBQUVBLElBQUlqSixNQUFKO0FBQ0EzVCxNQUFNLENBQUNDLE9BQVAsR0FBaUI7QUFDZjZRLEVBQUFBLFNBQVMsRUFBRSxNQUFNO0FBQ2ZoRCxJQUFBQSxTQUFTLENBQUMyTyxlQUFELEVBQWtCLDRDQUFsQixDQUFUO0FBQ0EzTyxJQUFBQSxTQUFTLENBQ1A0TyxtQkFETyxFQUVQLGdEQUZPLENBQVQ7QUFJQTVPLElBQUFBLFNBQVMsQ0FBQzhPLGFBQUQsRUFBZ0IsMENBQWhCLENBQVQ7O0FBRUEsUUFBSSxDQUFDakosTUFBTCxFQUFhO0FBQ1gsWUFBTTZLLFdBQVcsR0FBRzFlLG1CQUFPLENBQUMsd0RBQUQsQ0FBM0I7O0FBQ0E2VCxNQUFBQSxNQUFNLEdBQUcsSUFBSTZLLFdBQUosQ0FBZ0I7QUFDdkJDLFFBQUFBLFNBQVMsRUFBRSxJQURZO0FBRXZCemEsUUFBQUEsRUFBRSxFQUFFeVksZUFGbUI7QUFHdkJpQyxRQUFBQSxNQUFNLEVBQUVoQyxtQkFIZTtBQUl2QnhCLFFBQUFBLGNBQWMsRUFBRTBCO0FBSk8sT0FBaEIsQ0FBVDtBQU1EOztBQUVELFdBQU9qSixNQUFQO0FBQ0Q7QUFwQmMsQ0FBakI7Ozs7Ozs7Ozs7QUNQQSxNQUFNN0YsU0FBUyxHQUFHaE8sbUJBQU8sQ0FBQyw0QkFBRCxDQUF6Qjs7QUFFQSxNQUFNNEIsV0FBVyxHQUFHNUIsbUJBQU8sQ0FBQywyREFBRCxDQUEzQjtBQUVBO0FBQ0E7QUFDQTs7O0FBQ0EsTUFBTTZlLFVBQVUsR0FBRzdkLE9BQU8sQ0FBQ0MsR0FBUixDQUFZNGQsVUFBL0IsRUFFQTs7QUFDQSxNQUFNcGYsc0JBQXNCLEdBQUcsWUFBL0I7QUFDQSxNQUFNQyx5QkFBeUIsR0FBRyxLQUFLLEVBQUwsR0FBVSxFQUE1QztBQUNBLE1BQU1rQix5QkFBeUIsR0FBRyxvQkFBbEM7QUFDQSxNQUFNa2UsNEJBQTRCLEdBQUcsS0FBSyxFQUFMLEdBQVUsRUFBVixHQUFlLENBQXBEOztBQUVBLGVBQWUvYixPQUFmLENBQXVCO0FBQUUxQyxFQUFBQTtBQUFGLENBQXZCLEVBQW9DO0FBQ2xDLFFBQU0wZSxhQUFhLEdBQUcxZSxPQUFPLENBQUNHLElBQTlCO0FBRUEsUUFBTUEsSUFBSSxHQUFHO0FBQ1h3ZSxJQUFBQSxVQUFVLEVBQUVoWSxPQUFPLENBQUMrWCxhQUFhLElBQUksV0FBV0EsYUFBN0IsQ0FEUjtBQUVYbGUsSUFBQUEsS0FBSyxFQUFFa2UsYUFBYSxJQUFJQSxhQUFhLENBQUNsZSxLQUYzQjtBQUdYb2UsSUFBQUEsVUFBVSxFQUFHLEdBQUU1ZSxPQUFPLENBQUNTLFVBQVc7QUFIdkIsR0FBYjs7QUFNQSxNQUFJTixJQUFJLElBQUlBLElBQUksQ0FBQ3dlLFVBQWpCLEVBQTZCO0FBQzNCLFVBQU1FLG1CQUFtQixHQUFHLE1BQU10ZCxXQUFXLENBQUNxTCxTQUFaLENBQXNCbkssR0FBdEIsQ0FBMEI7QUFDMUQrSSxNQUFBQSxVQUFVLEVBQUVyTCxJQUFJLENBQUNLO0FBRHlDLEtBQTFCLENBQWxDOztBQUdBLFFBQUlxZSxtQkFBSixFQUF5QjtBQUN2QkMsTUFBQUEsTUFBTSxDQUFDQyxNQUFQLENBQWM1ZSxJQUFkLEVBQW9CMGUsbUJBQXBCO0FBQ0Q7QUFDRjs7QUFFRCxTQUFPMWUsSUFBUDtBQUNEOztBQUVETixNQUFNLENBQUNDLE9BQVAsR0FBaUI7QUFDZlYsRUFBQUEsc0JBRGU7QUFFZm1CLEVBQUFBLHlCQUZlO0FBR2ZsQixFQUFBQSx5QkFIZTtBQUlmb2YsRUFBQUEsNEJBSmU7O0FBS2ZyZSxFQUFBQSxZQUFZLENBQUM0ZSxLQUFELEVBQVE7QUFDbEJyUixJQUFBQSxTQUFTLENBQUM2USxVQUFELEVBQWEsdUNBQWIsQ0FBVDs7QUFFQSxRQUFJLENBQUNRLEtBQUwsRUFBWTtBQUNWLGFBQU8sSUFBUDtBQUNEOztBQUVELFFBQUk7QUFDRixZQUFNQyxHQUFHLEdBQUd0ZixtQkFBTyxDQUFDLGtDQUFELENBQW5COztBQUNBLFlBQU11ZixPQUFPLEdBQUdELEdBQUcsQ0FBQ0UsTUFBSixDQUFXSCxLQUFYLEVBQWtCUixVQUFsQixDQUFoQjs7QUFDQSxVQUFJLENBQUNVLE9BQUwsRUFBYztBQUNaLGVBQU8sSUFBUDtBQUNEOztBQUVELGFBQU87QUFDTDFlLFFBQUFBLEtBQUssRUFBRTBlLE9BQU8sQ0FBQzFlO0FBRFYsT0FBUDtBQUdELEtBVkQsQ0FVRSxPQUFPNGUsQ0FBUCxFQUFVO0FBQ1YsYUFBTyxJQUFQO0FBQ0Q7QUFDRixHQXpCYzs7QUEwQmYsUUFBTXBiLGFBQU4sQ0FBb0I7QUFBRXhELElBQUFBLEtBQUY7QUFBUzZlLElBQUFBLHFCQUFUO0FBQWdDcmYsSUFBQUE7QUFBaEMsR0FBcEIsRUFBK0Q7QUFDN0QyTixJQUFBQSxTQUFTLENBQUM2USxVQUFELEVBQWEsdUNBQWIsQ0FBVDtBQUVBLFVBQU07QUFBRS9kLE1BQUFBO0FBQUYsUUFBaUJULE9BQXZCO0FBRUEsVUFBTTZlLG1CQUFtQixHQUFHLE1BQU10ZCxXQUFXLENBQUNxTCxTQUFaLENBQXNCbkssR0FBdEIsQ0FBMEI7QUFDMUQrSSxNQUFBQSxVQUFVLEVBQUVoTDtBQUQ4QyxLQUExQixDQUFsQztBQUlBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUNJLFFBQUksQ0FBQ3FlLG1CQUFMLEVBQTBCO0FBQ3hCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsWUFBTVMsVUFBVSxHQUFHOWUsS0FBSyxDQUFDK1UsS0FBTixDQUFZLEdBQVosQ0FBbkI7QUFDQSxZQUFNaFUsV0FBVyxDQUFDcUwsU0FBWixDQUFzQkwsTUFBdEIsQ0FBNkI7QUFDakNmLFFBQUFBLFVBQVUsRUFBRWhMLEtBRHFCO0FBRWpDc08sUUFBQUEsU0FBUyxFQUFFd1EsVUFBVSxDQUFDLENBQUQsQ0FGWTtBQUdqQ3ZRLFFBQUFBLFFBQVEsRUFBRXVRLFVBQVUsQ0FBQyxDQUFEO0FBSGEsT0FBN0IsQ0FBTjtBQUtEO0FBRUQ7QUFDSjtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0ksVUFBTXRQLFNBQVMsR0FBRyxJQUFJOEIsR0FBSixDQUFTLEdBQUVyUixVQUFXLHdCQUF0QixDQUFsQjtBQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7O0FBQ0ksVUFBTXdlLEdBQUcsR0FBR3RmLG1CQUFPLENBQUMsa0NBQUQsQ0FBbkI7O0FBQ0FxUSxJQUFBQSxTQUFTLENBQUNnQyxZQUFWLENBQXVCQyxNQUF2QixDQUNFLE9BREYsRUFFRWdOLEdBQUcsQ0FBQ00sSUFBSixDQUFTO0FBQUUvZSxNQUFBQSxLQUFGO0FBQVM2ZSxNQUFBQTtBQUFULEtBQVQsRUFBMkNiLFVBQTNDLEVBQXVEO0FBQ3JEZ0IsTUFBQUEsU0FBUyxFQUFFO0FBRDBDLEtBQXZELENBRkY7O0FBT0EsVUFBTUMsWUFBWSxHQUFHOWYsbUJBQU8sQ0FBQywrREFBRCxDQUE1Qjs7QUFFQSxVQUFNO0FBQUUrUCxNQUFBQTtBQUFGLFFBQWMsTUFBTStQLFlBQVksQ0FBQ2xRLGlCQUFiLENBQStCO0FBQ3ZEUyxNQUFBQSxTQUFTLEVBQUVBLFNBQVMsQ0FBQ3dDLFFBQVYsRUFENEM7QUFFdkRoUyxNQUFBQTtBQUZ1RCxLQUEvQixDQUExQjtBQUtBLFdBQU87QUFBRWtQLE1BQUFBO0FBQUYsS0FBUDtBQUNELEdBbkZjOztBQW9GZmdRLEVBQUFBLHNCQUFzQixDQUFDVixLQUFELEVBQVE7QUFDNUJyUixJQUFBQSxTQUFTLENBQUM2USxVQUFELEVBQWEsdUNBQWIsQ0FBVDtBQUVBO0FBQ0o7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFSSxRQUFJO0FBQ0YsWUFBTVMsR0FBRyxHQUFHdGYsbUJBQU8sQ0FBQyxrQ0FBRCxDQUFuQjs7QUFDQSxZQUFNdWYsT0FBTyxHQUFHRCxHQUFHLENBQUNFLE1BQUosQ0FBV0gsS0FBWCxFQUFrQlIsVUFBbEIsQ0FBaEI7QUFDQSxZQUFNO0FBQUVoZSxRQUFBQSxLQUFGO0FBQVM2ZSxRQUFBQTtBQUFULFVBQW1DSCxPQUF6QztBQUVBLFlBQU1TLGdCQUFnQixHQUFHVixHQUFHLENBQUNNLElBQUosQ0FBUztBQUFFL2UsUUFBQUE7QUFBRixPQUFULEVBQW9CZ2UsVUFBcEIsRUFBZ0M7QUFDdkRnQixRQUFBQSxTQUFTLEVBQUVuZ0I7QUFENEMsT0FBaEMsQ0FBekI7QUFHQSxZQUFNdWdCLHVCQUF1QixHQUFHWCxHQUFHLENBQUNNLElBQUosQ0FBUztBQUFFL2UsUUFBQUE7QUFBRixPQUFULEVBQW9CZ2UsVUFBcEIsRUFBZ0M7QUFDOURnQixRQUFBQSxTQUFTLEVBQUVmO0FBRG1ELE9BQWhDLENBQWhDO0FBSUEsYUFBTztBQUNML08sUUFBQUEsT0FBTyxFQUFFLElBREo7QUFFTGlRLFFBQUFBLGdCQUZLO0FBR0x0Z0IsUUFBQUEseUJBSEs7QUFJTHVnQixRQUFBQSx1QkFKSztBQUtMUCxRQUFBQSxxQkFMSztBQU1MWixRQUFBQTtBQU5LLE9BQVA7QUFRRCxLQXBCRCxDQW9CRSxPQUFPOU8sS0FBUCxFQUFjO0FBQ2QzTSxNQUFBQSxPQUFPLENBQUNDLEdBQVIsQ0FBWTBNLEtBQVo7QUFDQSxhQUFPO0FBQ0xELFFBQUFBLE9BQU8sRUFBRSxLQURKO0FBRUxDLFFBQUFBO0FBRkssT0FBUDtBQUlEO0FBQ0YsR0F6SGM7O0FBMEhmdFAsRUFBQUEsb0JBQW9CLENBQUM7QUFBRUMsSUFBQUEsWUFBRjtBQUFnQkUsSUFBQUE7QUFBaEIsR0FBRCxFQUEwQjtBQUM1QyxRQUFJLENBQUNGLFlBQUQsSUFBaUIsQ0FBQ0UsS0FBdEIsRUFBNkI7QUFDM0IsYUFBTyxLQUFQO0FBQ0Q7O0FBRUQsUUFBSTtBQUNGLFlBQU15ZSxHQUFHLEdBQUd0ZixtQkFBTyxDQUFDLGtDQUFELENBQW5COztBQUNBLFlBQU11ZixPQUFPLEdBQUdELEdBQUcsQ0FBQ0UsTUFBSixDQUFXN2UsWUFBWCxFQUF5QmtlLFVBQXpCLENBQWhCOztBQUNBLFVBQUlVLE9BQU8sQ0FBQzFlLEtBQVIsS0FBa0JBLEtBQXRCLEVBQTZCO0FBQzNCLGVBQU95ZSxHQUFHLENBQUNNLElBQUosQ0FBUztBQUFFL2UsVUFBQUE7QUFBRixTQUFULEVBQW9CZ2UsVUFBcEIsRUFBZ0M7QUFDckNnQixVQUFBQSxTQUFTLEVBQUVuZ0I7QUFEMEIsU0FBaEMsQ0FBUDtBQUdEO0FBQ0YsS0FSRCxDQVFFLE9BQU8rZixDQUFQLEVBQVU7QUFDVnBjLE1BQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFZbWMsQ0FBWjtBQUNEOztBQUVELFdBQU8sS0FBUDtBQUNELEdBNUljOztBQTZJZjFjLEVBQUFBLE9BN0llOztBQThJZixRQUFNdUIsTUFBTixDQUFhO0FBQUVqRSxJQUFBQSxPQUFGO0FBQVdzTSxJQUFBQTtBQUFYLEdBQWIsRUFBaUM7QUFDL0IsVUFBTTtBQUFFbk0sTUFBQUE7QUFBRixRQUFXSCxPQUFqQjs7QUFDQSxRQUFJLENBQUNHLElBQUwsRUFBVztBQUNULFlBQU0sSUFBSStGLEtBQUosQ0FBVSwwQkFBVixDQUFOO0FBQ0Q7O0FBQ0QsVUFBTTNFLFdBQVcsQ0FBQ3FMLFNBQVosQ0FBc0IzSSxNQUF0QixDQUE2QjtBQUNqQ3VILE1BQUFBLFVBQVUsRUFBRXJMLElBQUksQ0FBQ0ssS0FEZ0I7QUFFakM0TCxNQUFBQSxRQUFRLEVBQUVFO0FBRnVCLEtBQTdCLENBQU47QUFLQSxXQUFPNUosT0FBTyxDQUFDO0FBQUUxQyxNQUFBQTtBQUFGLEtBQUQsQ0FBZDtBQUNEOztBQXpKYyxDQUFqQjs7Ozs7Ozs7OztBQ3BDQSxNQUFNO0FBQUV5SCxFQUFBQTtBQUFGLElBQXVCOUgsbUJBQU8sQ0FBQyxpRUFBRCxDQUFwQztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQUNBRSxNQUFNLENBQUNDLE9BQVAsR0FBaUIsZUFBZStmLHNCQUFmLEdBQXdDO0FBQ3ZELFFBQU1DLHVCQUF1QixHQUFHLE1BQU1yWSxnQkFBZ0IsQ0FBQztBQUNyRE8sSUFBQUEsS0FBSyxFQUFHO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQTlCeUQsR0FBRCxDQUF0RDs7QUFpQ0EsTUFDRSxDQUFDOFgsdUJBQXVCLENBQUN6WCxJQUF6QixJQUNBLENBQUN5WCx1QkFBdUIsQ0FBQ3pYLElBQXhCLENBQTZCMFgsU0FGaEMsRUFHRTtBQUNBLFdBQU8sRUFBUDtBQUNEOztBQUVELFNBQU9ELHVCQUF1QixDQUFDelgsSUFBeEIsQ0FBNkIwWCxTQUE3QixDQUF1Q0MsUUFBdkMsQ0FBZ0QvVyxHQUFoRCxDQUNKZ1gsc0JBQUQsSUFBNEI7QUFDMUIsVUFBTUMsaUJBQWlCLEdBQ3JCRCxzQkFBc0IsQ0FBQ3ZWLFFBQXZCLENBQWdDeVYsT0FBaEMsQ0FBd0NDLGlCQUQxQztBQUdBLFFBQUl4WixjQUFjLEdBQUcsSUFBckI7QUFDQSxRQUFJRSxlQUFlLEdBQUcsSUFBdEI7O0FBQ0EsUUFBSW9aLGlCQUFpQixDQUFDcmMsRUFBbEIsS0FBeUIsU0FBN0IsRUFBd0M7QUFDdENpRCxNQUFBQSxlQUFlLEdBQUdvWixpQkFBaUIsQ0FBQ0MsT0FBbEIsQ0FBMEJFLE1BQTVDO0FBQ0QsS0FGRCxNQUVPO0FBQ0x6WixNQUFBQSxjQUFjLEdBQUdzWixpQkFBaUIsQ0FBQ0MsT0FBbEIsQ0FBMEJFLE1BQTNDO0FBQ0Q7O0FBRUQsV0FBTztBQUNMdlYsTUFBQUEsSUFBSSxFQUFFbVYsc0JBQXNCLENBQUNuVixJQUF2QixDQUE0QnFWLE9BQTVCLENBQW9DRyxJQURyQztBQUVMMVosTUFBQUEsY0FGSztBQUdMRSxNQUFBQSxlQUhLO0FBSUx5WixNQUFBQSxxQkFBcUIsRUFBRTtBQUpsQixLQUFQO0FBTUQsR0FuQkksQ0FBUDtBQXFCRCxDQTlERDs7Ozs7Ozs7OztBQ25CQSxNQUFNVixzQkFBc0IsR0FBR2xnQixtQkFBTyxDQUFDLHNHQUFELENBQXRDO0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0EsTUFBTTZnQixlQUFlLEdBQUcsQ0FDdEI7QUFDRTFWLEVBQUFBLElBQUksRUFBRSxTQURSO0FBRUVsRSxFQUFBQSxjQUFjLEVBQUUsQ0FGbEI7QUFHRUUsRUFBQUEsZUFBZSxFQUFFLElBSG5CO0FBSUV5WixFQUFBQSxxQkFBcUIsRUFBRTtBQUp6QixDQURzQixFQU90QjtBQUNFelYsRUFBQUEsSUFBSSxFQUFFLFdBRFI7QUFFRWxFLEVBQUFBLGNBQWMsRUFBRSxJQUZsQjtBQUdFRSxFQUFBQSxlQUFlLEVBQUUsQ0FIbkI7QUFJRXlaLEVBQUFBLHFCQUFxQixFQUFFO0FBSnpCLENBUHNCLEVBYXRCO0FBQ0V6VixFQUFBQSxJQUFJLEVBQUUsd0JBRFI7QUFFRWxFLEVBQUFBLGNBQWMsRUFBRSxJQUZsQjtBQUdFRSxFQUFBQSxlQUFlLEVBQUUsRUFIbkI7QUFJRXlaLEVBQUFBLHFCQUFxQixFQUFFO0FBSnpCLENBYnNCLEVBbUJ0QjtBQUNFelYsRUFBQUEsSUFBSSxFQUFFLHFCQURSO0FBRUVsRSxFQUFBQSxjQUFjLEVBQUUsR0FGbEI7QUFHRUUsRUFBQUEsZUFBZSxFQUFFLElBSG5CO0FBSUV5WixFQUFBQSxxQkFBcUIsRUFBRTtBQUp6QixDQW5Cc0IsQ0FBeEI7QUEyQkExZ0IsTUFBTSxDQUFDQyxPQUFQLEdBQWlCO0FBQ2YsUUFBTTJDLEdBQU4sQ0FBVTtBQUFFcUksSUFBQUEsSUFBRjtBQUFROUssSUFBQUE7QUFBUixHQUFWLEVBQTZCO0FBQzNCLFVBQU07QUFBRUcsTUFBQUE7QUFBRixRQUFXSCxPQUFqQjtBQUVBLFVBQU15Z0IsZUFBZSxHQUFHLENBQUN0Z0IsSUFBRCxJQUFTLENBQUNBLElBQUksQ0FBQ3dlLFVBQXZDO0FBRUEsVUFBTStCLHNCQUFzQixHQUFHLE1BQU1iLHNCQUFzQixFQUEzRDtBQUVBLFVBQU1jLFdBQVcsR0FBRyxDQUFDLEdBQUdILGVBQUosRUFBcUIsR0FBR0Usc0JBQXhCLENBQXBCLENBUDJCLENBUzNCO0FBQ0E7O0FBQ0EsUUFBSUQsZUFBSixFQUFxQjtBQUNuQixZQUFNNWQsT0FBTyxHQUFHOGQsV0FBVyxDQUN4Qm5YLE1BRGEsQ0FDTEgsQ0FBRCxJQUFPLENBQUNBLENBQUMsQ0FBQ2tYLHFCQURKLEVBRWJuWCxJQUZhLENBRVBDLENBQUQsSUFBT0EsQ0FBQyxDQUFDeUIsSUFBRixLQUFXQSxJQUZWLENBQWhCO0FBSUEsYUFBTztBQUNMQyxRQUFBQSxPQUFPLEVBQUVwRSxPQUFPLENBQUM5RCxPQUFELENBRFg7QUFFTEEsUUFBQUE7QUFGSyxPQUFQO0FBSUQsS0FwQjBCLENBc0IzQjs7O0FBQ0EsUUFBSUEsT0FBTyxHQUFHOGQsV0FBVyxDQUFDdlgsSUFBWixDQUFrQkMsQ0FBRCxJQUFPQSxDQUFDLENBQUN5QixJQUFGLEtBQVdBLElBQW5DLENBQWQ7QUFFQSxXQUFPO0FBQ0xDLE1BQUFBLE9BQU8sRUFBRXBFLE9BQU8sQ0FBQzlELE9BQUQsQ0FEWDtBQUVMQSxNQUFBQTtBQUZLLEtBQVA7QUFJRDs7QUE5QmMsQ0FBakI7Ozs7Ozs7Ozs7O0FDbENBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBOzs7Ozs7Ozs7OztBQ0FBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vbGliL2NvcnMuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vcGFnZXMvYXBpL2dyYXBocWwuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL2dyYXBocWwtc2VydmVyL2NyZWF0ZS1jb250ZXh0LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9ncmFwaHFsLXNlcnZlci9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvZ3JhcGhxbC1zZXJ2ZXIvcmVzb2x2ZXJzLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9ncmFwaHFsLXNlcnZlci90eXBlLWRlZnMuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL2xpYi9jdXJyZW5jeS5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvbGliL2dldC1ob3N0LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9iYXNrZXQtc2VydmljZS9jYWxjdWxhdGUtdm91Y2hlci1kaXNjb3VudC1hbW91bnQuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2Jhc2tldC1zZXJ2aWNlL2dldC1wcm9kdWN0cy1mcm9tLWNyeXN0YWxsaXplLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9iYXNrZXQtc2VydmljZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvY3J5c3RhbGxpemUvY3VzdG9tZXJzL2NyZWF0ZS1jdXN0b21lci5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvY3J5c3RhbGxpemUvY3VzdG9tZXJzL2dldC1jdXN0b21lci5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvY3J5c3RhbGxpemUvY3VzdG9tZXJzL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9jcnlzdGFsbGl6ZS9jdXN0b21lcnMvdXBkYXRlLWN1c3RvbWVyLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9jcnlzdGFsbGl6ZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvY3J5c3RhbGxpemUvb3JkZXJzL2NyZWF0ZS1vcmRlci5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvY3J5c3RhbGxpemUvb3JkZXJzL2dldC1vcmRlci5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvY3J5c3RhbGxpemUvb3JkZXJzL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9jcnlzdGFsbGl6ZS9vcmRlcnMvdXBkYXRlLW9yZGVyLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9jcnlzdGFsbGl6ZS9vcmRlcnMvd2FpdC1mb3Itb3JkZXItdG8tYmUtcGVyc2lzdGF0ZWQuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2NyeXN0YWxsaXplL3V0aWxzLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9lbWFpbC1zZXJ2aWNlL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9lbWFpbC1zZXJ2aWNlL29yZGVyLWNvbmZpcm1hdGlvbi5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvZW1haWwtc2VydmljZS91c2VyLW1hZ2ljLWxpbmsuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL2VtYWlsLXNlcnZpY2UvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL2ludm9pY2UvY3JlYXRlLWNyeXN0YWxsaXplLW9yZGVyLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9pbnZvaWNlL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9rbGFybmEvY2FwdHVyZS5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMva2xhcm5hL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9rbGFybmEvcHVzaC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMva2xhcm5hL3JlbmRlci1jaGVja291dC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMva2xhcm5hL3RvLWtsYXJuYS1vcmRlci1tb2RlbC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMva2xhcm5hL3V0aWxzLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9tb2xsaWUvY3JlYXRlLXBheW1lbnQuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL21vbGxpZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvbW9sbGllL3RvLWNyeXN0YWxsaXplLW9yZGVyLW1vZGVsLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9tb2xsaWUvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3BheXBhbC9jb25maXJtLXBheW1lbnQuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3BheXBhbC9jcmVhdGUtcGF5bWVudC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvcGF5cGFsL2luZGV4LmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9wYXlwYWwvaW5pdC1jbGllbnQuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3BheXBhbC90by1jcnlzdGFsbGl6ZS1vcmRlci1tb2RlbC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvc3RyaXBlL2NvbmZpcm0tb3JkZXIuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3N0cmlwZS9jcmVhdGUtcGF5bWVudC1pbnRlbnQuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3N0cmlwZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvc3RyaXBlL3RvLWNyeXN0YWxsaXplLW9yZGVyLW1vZGVsLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9zdHJpcGUvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL3ZpcHBzL2ZhbGxiYWNrLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy92aXBwcy9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvdmlwcHMvaW5pdGlhdGUtcGF5bWVudC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvdmlwcHMvb3JkZXItdXBkYXRlLmpzIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC8uL3NyYy9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy92aXBwcy91c2VyLWNvbnNlbnQtcmVtb3ZhbC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMvdmlwcHMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3VzZXItc2VydmljZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvLi9zcmMvc2VydmljZXMvdm91Y2hlci1zZXJ2aWNlL2NyeXN0YWxsaXplLXZvdWNoZXJzLWV4YW1wbGUuanMiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwLy4vc3JjL3NlcnZpY2VzL3ZvdWNoZXItc2VydmljZS9pbmRleC5qcyIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvZXh0ZXJuYWwgXCJAY3J5c3RhbGxpemUvbm9kZS1rbGFybmFcIiIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvZXh0ZXJuYWwgXCJAY3J5c3RhbGxpemUvbm9kZS12aXBwc1wiIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC9leHRlcm5hbCBcIkBtb2xsaWUvYXBpLWNsaWVudFwiIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC9leHRlcm5hbCBcIkBwYXlwYWwvY2hlY2tvdXQtc2VydmVyLXNka1wiIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC9leHRlcm5hbCBcIkBzZW5kZ3JpZC9tYWlsXCIiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwL2V4dGVybmFsIFwiYXBvbGxvLXNlcnZlci1taWNyb1wiIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC9leHRlcm5hbCBcImdyYXBocWwtdGFnXCIiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwL2V4dGVybmFsIFwiaW52YXJpYW50XCIiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwL2V4dGVybmFsIFwianNvbndlYnRva2VuXCIiLCJ3ZWJwYWNrOi8vY3J5c3RhbGxpemUtYXBwL2V4dGVybmFsIFwibWptbFwiIiwid2VicGFjazovL2NyeXN0YWxsaXplLWFwcC9leHRlcm5hbCBcIm5vZGUtZmV0Y2hcIiIsIndlYnBhY2s6Ly9jcnlzdGFsbGl6ZS1hcHAvZXh0ZXJuYWwgXCJzdHJpcGVcIiJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBhbGxvd0NvcnMgPSAoZm4pID0+IGFzeW5jIChyZXEsIHJlcykgPT4ge1xuICByZXMuc2V0SGVhZGVyKFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctQ3JlZGVudGlhbHNcIiwgdHJ1ZSk7XG4gIHJlcy5zZXRIZWFkZXIoXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1PcmlnaW5cIiwgcmVxLmhlYWRlcnMub3JpZ2luIHx8ICcqJyk7XG4gIHJlcy5zZXRIZWFkZXIoXG4gICAgXCJBY2Nlc3MtQ29udHJvbC1BbGxvdy1NZXRob2RzXCIsXG4gICAgXCJHRVQsT1BUSU9OUyxQQVRDSCxERUxFVEUsUE9TVCxQVVRcIlxuICApO1xuICByZXMuc2V0SGVhZGVyKFxuICAgIFwiQWNjZXNzLUNvbnRyb2wtQWxsb3ctSGVhZGVyc1wiLFxuICAgIFwiWC1DU1JGLVRva2VuLCBYLVJlcXVlc3RlZC1XaXRoLCBBY2NlcHQsIEFjY2VwdC1WZXJzaW9uLCBDb250ZW50LUxlbmd0aCwgQ29udGVudC1NRDUsIENvbnRlbnQtVHlwZSwgRGF0ZSwgWC1BcGktVmVyc2lvblwiXG4gICk7XG4gIGlmIChyZXEubWV0aG9kID09PSBcIk9QVElPTlNcIikge1xuICAgIHJlcy5zdGF0dXMoMjAwKS5lbmQoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgcmV0dXJuIGF3YWl0IGZuKHJlcSwgcmVzKTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGFsbG93Q29ycztcbiIsImltcG9ydCB7IEFwb2xsb1NlcnZlciB9IGZyb20gXCJhcG9sbG8tc2VydmVyLW1pY3JvXCI7XG5cbmltcG9ydCBjb3JzIGZyb20gXCIuLi8uLi9saWIvY29yc1wiO1xuXG5pbXBvcnQgY3JlYXRlR3JhcGhRTFNlcnZlckNvbmZpZyBmcm9tIFwiLi4vLi4vc3JjL2dyYXBocWwtc2VydmVyXCI7XG5pbXBvcnQgdXNlclNlcnZpY2UgZnJvbSBcIi4uLy4uL3NyYy9zZXJ2aWNlcy91c2VyLXNlcnZpY2VcIjtcblxuY29uc3QgYXBvbGxvU2VydmVyID0gbmV3IEFwb2xsb1NlcnZlcihcbiAgY3JlYXRlR3JhcGhRTFNlcnZlckNvbmZpZyh7XG4gICAgYXBpUGF0aFByZWZpeDogXCIvYXBpXCIsXG4gICAgbm9ybWFsaXNlUmVxdWVzdCh7IHJlcSB9KSB7XG4gICAgICByZXR1cm4gcmVxO1xuICAgIH0sXG4gICAgcmVmcmVzaFVzZXJUb2tlbih7IHJlcyB9LCBuZXdVc2VyVG9rZW4pIHtcbiAgICAgIHJlcy5zZXRIZWFkZXIoXG4gICAgICAgIFwiU2V0LUNvb2tpZVwiLFxuICAgICAgICBgJHt1c2VyU2VydmljZS5DT09LSUVfVVNFUl9UT0tFTl9OQU1FfT0ke25ld1VzZXJUb2tlbn07IEh0dHBPbmx5OyBNYXgtQWdlPSR7dXNlclNlcnZpY2UuQ09PS0lFX1VTRVJfVE9LRU5fTUFYX0FHRX07IFBhdGg9L2BcbiAgICAgICk7XG4gICAgfSxcbiAgfSlcbik7XG5cbmV4cG9ydCBjb25zdCBjb25maWcgPSB7XG4gIGFwaToge1xuICAgIGJvZHlQYXJzZXI6IGZhbHNlLFxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgY29ycyhhcG9sbG9TZXJ2ZXIuY3JlYXRlSGFuZGxlcih7IHBhdGg6IFwiL2FwaS9ncmFwaHFsXCIgfSkpO1xuIiwiY29uc3QgdXNlclNlcnZpY2UgPSByZXF1aXJlKFwiLi4vc2VydmljZXMvdXNlci1zZXJ2aWNlXCIpO1xuY29uc3QgZ2V0SG9zdCA9IHJlcXVpcmUoXCIuLi9saWIvZ2V0LWhvc3RcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gY3JlYXRlQ29udGV4dCh7XG4gIGFwaVBhdGhQcmVmaXgsXG4gIG5vcm1hbGlzZVJlcXVlc3QsXG4gIHJlZnJlc2hVc2VyVG9rZW4sXG59KSB7XG4gIHJldHVybiBmdW5jdGlvbiBjb250ZXh0KGFyZ3MpIHtcbiAgICBjb25zdCB7IGNvb2tpZXMsIGhlYWRlcnMgfSA9IG5vcm1hbGlzZVJlcXVlc3QoYXJncyk7XG5cbiAgICBjb25zdCB1c2VyID0gdXNlclNlcnZpY2UuYXV0aGVudGljYXRlKFxuICAgICAgY29va2llc1t1c2VyU2VydmljZS5DT09LSUVfVVNFUl9UT0tFTl9OQU1FXVxuICAgICk7XG5cbiAgICAvLyBSZWZyZXNoIHRoZSB1c2VyIHRva2VuIChpZiBhdmFpbGFibGUpXG4gICAgaWYgKHVzZXIgJiYgcmVmcmVzaFVzZXJUb2tlbikge1xuICAgICAgY29uc3QgbmV3VXNlclRva2VuID0gdXNlclNlcnZpY2UudmFsaWRhdGVSZWZyZXNoVG9rZW4oe1xuICAgICAgICByZWZyZXNoVG9rZW46IGNvb2tpZXNbdXNlclNlcnZpY2UuQ09PS0lFX1JFRlJFU0hfVE9LRU5fTkFNRV0sXG4gICAgICAgIGVtYWlsOiB1c2VyLmVtYWlsLFxuICAgICAgfSk7XG4gICAgICBpZiAobmV3VXNlclRva2VuKSB7XG4gICAgICAgIHJlZnJlc2hVc2VyVG9rZW4oYXJncywgbmV3VXNlclRva2VuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBEZXRlcm1pbmUgdGhlIFVSTCBmb3Igd2ViaG9vayBjYWxsYmFja3MgKGV4OiBodHRwczovL3NlcnZpY2UtYXBpLmV4YW1wbGUuY29tL2FwaSlcbiAgICBjb25zdCBwdWJsaWNIb3N0ID0gZ2V0SG9zdCh7IGhlYWRlcnMgfSkgKyBhcGlQYXRoUHJlZml4O1xuXG4gICAgLyoqXG4gICAgICogc2VydmljZUNhbGxiYWNrSG9zdCBpcyB1c2VkIGZvciB0aGlyZCBwYXJ0eSBzZXJ2aWNlcyBjYWxsYmFja3NcbiAgICAgKiBJdCB3aWxsIGJlIHVzZWQgaW4gZS5nLiBwYXltZW50IHByb3ZpZGVyIHNlcnZpY2VzIGNhbGxiYWNrc1xuICAgICAqIHdoZW4gYXN5bmMgb3BlcmF0aW9ucyBhcmUgZmluaXNoZWRcbiAgICAgKlxuICAgICAqIEV4YW1wbGUgZm9yIGxvY2FsIGRldmVsb3BtZW50OlxuICAgICAqICAtIHB1YmxpY0hvc3Q6IGh0dHA6Ly9sb2NhbGhvc3Q6MzAwMS9hcGlcbiAgICAgKiAgLSBzZXJ2aWNlQ2FsbGJhY2tIb3N0OiBodHRwczovL2FiY2RlZmdoMTIzNDUubmdyb2suaW8vYXBpXG4gICAgICpcbiAgICAgKiBFeGFtcGxlIGZvciBwcm9kIGRldmVsb3BtZW50OlxuICAgICAqICAtIHB1YmxpY0hvc3Q6IGh0dHBzOi8vbXktc2VydmljZS1hcGkuc2hvcC5jb20vYXBpXG4gICAgICogIC0gc2VydmljZUNhbGxiYWNrSG9zdDogaHR0cHM6Ly9teS1zZXJ2aWNlLWFwaS5zaG9wLmNvbS9hcGlcbiAgICAgKi9cbiAgICBsZXQgc2VydmljZUNhbGxiYWNrSG9zdCA9IHByb2Nlc3MuZW52LlNFUlZJQ0VfQ0FMTEJBQ0tfSE9TVDtcbiAgICBpZiAoc2VydmljZUNhbGxiYWNrSG9zdCkge1xuICAgICAgaWYgKCFzZXJ2aWNlQ2FsbGJhY2tIb3N0LmVuZHNXaXRoKGFwaVBhdGhQcmVmaXgpKSB7XG4gICAgICAgIHNlcnZpY2VDYWxsYmFja0hvc3QgKz0gYXBpUGF0aFByZWZpeDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2VydmljZUNhbGxiYWNrSG9zdCA9IHB1YmxpY0hvc3Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVzZXIsXG4gICAgICBwdWJsaWNIb3N0LFxuICAgICAgc2VydmljZUNhbGxiYWNrSG9zdCxcbiAgICB9O1xuICB9O1xufTtcbiIsImNvbnN0IGNyZWF0ZUNvbnRleHQgPSByZXF1aXJlKFwiLi9jcmVhdGUtY29udGV4dFwiKTtcbmNvbnN0IHJlc29sdmVycyA9IHJlcXVpcmUoXCIuL3Jlc29sdmVyc1wiKTtcbmNvbnN0IHR5cGVEZWZzID0gcmVxdWlyZShcIi4vdHlwZS1kZWZzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyZWF0ZUdyYXBocWxTZXJ2ZXJDb25maWcoe1xuICBhcGlQYXRoUHJlZml4ID0gXCJcIixcbiAgcmVmcmVzaFVzZXJUb2tlbixcbiAgbm9ybWFsaXNlUmVxdWVzdCxcbn0pIHtcbiAgY29uc3QgY29udGV4dCA9IGNyZWF0ZUNvbnRleHQoe1xuICAgIGFwaVBhdGhQcmVmaXgsXG4gICAgcmVmcmVzaFVzZXJUb2tlbixcbiAgICBub3JtYWxpc2VSZXF1ZXN0LFxuICB9KTtcblxuICByZXR1cm4ge1xuICAgIGNvbnRleHQsXG4gICAgcmVzb2x2ZXJzLFxuICAgIHR5cGVEZWZzLFxuICAgIGludHJvc3BlY3Rpb246IHRydWUsXG4gICAgcGxheWdyb3VuZDoge1xuICAgICAgZW5kcG9pbnQ6IGNvbnRleHQucHVibGljSG9zdCxcbiAgICAgIHNldHRpbmdzOiB7XG4gICAgICAgIFwicmVxdWVzdC5jcmVkZW50aWFsc1wiOiBcImluY2x1ZGVcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBEaXNhYmxlIHN1YnNjcmlwdGlvbnMgKG5vdCBjdXJyZW50bHkgc3VwcG9ydGVkIHdpdGggQXBvbGxvR2F0ZXdheSlcbiAgICBzdWJzY3JpcHRpb25zOiBmYWxzZSxcbiAgfTtcbn07XG4iLCJjb25zdCBjcnlzdGFsbGl6ZSA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlcy9jcnlzdGFsbGl6ZVwiKTtcblxuY29uc3QgYmFza2V0U2VydmljZSA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlcy9iYXNrZXQtc2VydmljZVwiKTtcbmNvbnN0IHVzZXJTZXJ2aWNlID0gcmVxdWlyZShcIi4uL3NlcnZpY2VzL3VzZXItc2VydmljZVwiKTtcbmNvbnN0IHZvdWNoZXJTZXJ2aWNlID0gcmVxdWlyZShcIi4uL3NlcnZpY2VzL3ZvdWNoZXItc2VydmljZVwiKTtcblxuY29uc3Qgc3RyaXBlU2VydmljZSA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9zdHJpcGVcIik7XG5jb25zdCBtb2xsaWVTZXJ2aWNlID0gcmVxdWlyZShcIi4uL3NlcnZpY2VzL3BheW1lbnQtcHJvdmlkZXJzL21vbGxpZVwiKTtcbmNvbnN0IHZpcHBzU2VydmljZSA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy92aXBwc1wiKTtcbmNvbnN0IGtsYXJuYVNlcnZpY2UgPSByZXF1aXJlKFwiLi4vc2VydmljZXMvcGF5bWVudC1wcm92aWRlcnMva2xhcm5hXCIpO1xuY29uc3QgcGF5cGFsU2VydmljZSA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9wYXlwYWxcIik7XG5jb25zdCBpbnZvaWNlU2VydmljZSA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlcy9wYXltZW50LXByb3ZpZGVycy9pbnZvaWNlXCIpO1xuXG5mdW5jdGlvbiBwYXltZW50UHJvdmlkZXJSZXNvbHZlcihzZXJ2aWNlKSB7XG4gIHJldHVybiAoKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVuYWJsZWQ6IHNlcnZpY2UuZW5hYmxlZCxcbiAgICAgIGNvbmZpZzogc2VydmljZS5mcm9udGVuZENvbmZpZyxcbiAgICB9O1xuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgUXVlcnk6IHtcbiAgICBteUN1c3RvbUJ1c2luZXNzVGhpbmc6ICgpID0+ICh7XG4gICAgICB3aGF0SXNUaGlzOlxuICAgICAgICBcIlRoaXMgaXMgYW4gZXhhbXBsZSBvZiBhIGN1c3RvbSBxdWVyeSBmb3IgR3JhcGhRTCBkZW1vbnN0cmF0aW9uIHB1cnB1c2VzLiBDaGVjayBvdXQgdGhlIE15Q3VzdG9tQnVzaW5uZXNzUXVlcmllcyByZXNvbHZlcnMgZm9yIGhvdyB0byByZXNvbHZlIGFkZGl0aW9uYWwgZmllbGRzIGFwYXJ0IGZyb20gdGhlICd3aGF0SXNUaGlzJyBmaWVsZFwiLFxuICAgIH0pLFxuICAgIGJhc2tldDogKHBhcmVudCwgYXJncywgY29udGV4dCkgPT4gYmFza2V0U2VydmljZS5nZXQoeyAuLi5hcmdzLCBjb250ZXh0IH0pLFxuICAgIHVzZXI6IChwYXJlbnQsIGFyZ3MsIGNvbnRleHQpID0+IHVzZXJTZXJ2aWNlLmdldFVzZXIoeyBjb250ZXh0IH0pLFxuICAgIG9yZGVyczogKCkgPT4gKHt9KSxcbiAgICBwYXltZW50UHJvdmlkZXJzOiAoKSA9PiAoe30pLFxuICAgIHZvdWNoZXI6IChwYXJlbnQsIGFyZ3MsIGNvbnRleHQpID0+XG4gICAgICB2b3VjaGVyU2VydmljZS5nZXQoeyAuLi5hcmdzLCBjb250ZXh0IH0pLFxuICB9LFxuICBNeUN1c3RvbUJ1c2lubmVzc1F1ZXJpZXM6IHtcbiAgICBkeW5hbWljUmFuZG9tSW50KCkge1xuICAgICAgY29uc29sZS5sb2coXCJkeW5hbWljUmFuZG9tSW50IGNhbGxlZFwiKTtcbiAgICAgIHJldHVybiBwYXJzZUludChNYXRoLnJhbmRvbSgpICogMTAwKTtcbiAgICB9LFxuICB9LFxuICBQYXltZW50UHJvdmlkZXJzUXVlcmllczoge1xuICAgIHN0cmlwZTogcGF5bWVudFByb3ZpZGVyUmVzb2x2ZXIoc3RyaXBlU2VydmljZSksXG4gICAga2xhcm5hOiBwYXltZW50UHJvdmlkZXJSZXNvbHZlcihrbGFybmFTZXJ2aWNlKSxcbiAgICB2aXBwczogcGF5bWVudFByb3ZpZGVyUmVzb2x2ZXIodmlwcHNTZXJ2aWNlKSxcbiAgICBtb2xsaWU6IHBheW1lbnRQcm92aWRlclJlc29sdmVyKG1vbGxpZVNlcnZpY2UpLFxuICAgIHBheXBhbDogcGF5bWVudFByb3ZpZGVyUmVzb2x2ZXIocGF5cGFsU2VydmljZSksXG4gICAgaW52b2ljZTogcGF5bWVudFByb3ZpZGVyUmVzb2x2ZXIoaW52b2ljZVNlcnZpY2UpLFxuICB9LFxuICBPcmRlclF1ZXJpZXM6IHtcbiAgICBnZXQ6IChwYXJlbnQsIGFyZ3MpID0+IGNyeXN0YWxsaXplLm9yZGVycy5nZXQoYXJncy5pZCksXG4gIH0sXG4gIE11dGF0aW9uOiB7XG4gICAgdXNlcjogKCkgPT4gKHt9KSxcbiAgICBwYXltZW50UHJvdmlkZXJzOiAoKSA9PiAoe30pLFxuICB9LFxuICBVc2VyTXV0YXRpb25zOiB7XG4gICAgc2VuZE1hZ2ljTGluazogKHBhcmVudCwgYXJncywgY29udGV4dCkgPT5cbiAgICAgIHVzZXJTZXJ2aWNlLnNlbmRNYWdpY0xpbmsoeyAuLi5hcmdzLCBjb250ZXh0IH0pLFxuICAgIHVwZGF0ZTogKHBhcmVudCwgYXJncywgY29udGV4dCkgPT4gdXNlclNlcnZpY2UudXBkYXRlKHsgLi4uYXJncywgY29udGV4dCB9KSxcbiAgfSxcbiAgUGF5bWVudFByb3ZpZGVyc011dGF0aW9uczoge1xuICAgIHN0cmlwZTogKCkgPT4gKHt9KSxcbiAgICBrbGFybmE6ICgpID0+ICh7fSksXG4gICAgbW9sbGllOiAoKSA9PiAoe30pLFxuICAgIHZpcHBzOiAoKSA9PiAoe30pLFxuICAgIHBheXBhbDogKCkgPT4gKHt9KSxcbiAgICBpbnZvaWNlOiAoKSA9PiAoe30pLFxuICB9LFxuICBTdHJpcGVNdXRhdGlvbnM6IHtcbiAgICBjcmVhdGVQYXltZW50SW50ZW50OiAocGFyZW50LCBhcmdzLCBjb250ZXh0KSA9PlxuICAgICAgc3RyaXBlU2VydmljZS5jcmVhdGVQYXltZW50SW50ZW50KHsgLi4uYXJncywgY29udGV4dCB9KSxcbiAgICBjb25maXJtT3JkZXI6IChwYXJlbnQsIGFyZ3MsIGNvbnRleHQpID0+XG4gICAgICBzdHJpcGVTZXJ2aWNlLmNvbmZpcm1PcmRlcih7IC4uLmFyZ3MsIGNvbnRleHQgfSksXG4gIH0sXG4gIEtsYXJuYU11dGF0aW9uczoge1xuICAgIHJlbmRlckNoZWNrb3V0OiAocGFyZW50LCBhcmdzLCBjb250ZXh0KSA9PlxuICAgICAga2xhcm5hU2VydmljZS5yZW5kZXJDaGVja291dCh7XG4gICAgICAgIC4uLmFyZ3MsXG4gICAgICAgIGNvbnRleHQsXG4gICAgICB9KSxcbiAgfSxcbiAgTW9sbGllTXV0YXRpb25zOiB7XG4gICAgY3JlYXRlUGF5bWVudDogKHBhcmVudCwgYXJncywgY29udGV4dCkgPT5cbiAgICAgIG1vbGxpZVNlcnZpY2UuY3JlYXRlUGF5bWVudCh7XG4gICAgICAgIC4uLmFyZ3MsXG4gICAgICAgIGNvbnRleHQsXG4gICAgICB9KSxcbiAgfSxcbiAgVmlwcHNNdXRhdGlvbnM6IHtcbiAgICBpbml0aWF0ZVBheW1lbnQ6IChwYXJlbnQsIGFyZ3MsIGNvbnRleHQpID0+XG4gICAgICB2aXBwc1NlcnZpY2UuaW5pdGlhdGVQYXltZW50KHtcbiAgICAgICAgLi4uYXJncyxcbiAgICAgICAgY29udGV4dCxcbiAgICAgIH0pLFxuICB9LFxuICBQYXlwYWxNdXRhdGlvbjoge1xuICAgIGNyZWF0ZVBheW1lbnQ6IChwYXJlbnQsIGFyZ3MsIGNvbnRleHQpID0+XG4gICAgICBwYXlwYWxTZXJ2aWNlLmNyZWF0ZVBheXBhbFBheW1lbnQoe1xuICAgICAgICAuLi5hcmdzLFxuICAgICAgICBjb250ZXh0LFxuICAgICAgICBwYXJlbnQsXG4gICAgICB9KSxcbiAgICBjb25maXJtUGF5bWVudDogKHBhcmVudCwgYXJncywgY29udGV4dCkgPT5cbiAgICAgIHBheXBhbFNlcnZpY2UuY29uZmlybVBheXBhbFBheW1lbnQoe1xuICAgICAgICAuLi5hcmdzLFxuICAgICAgICBjb250ZXh0LFxuICAgICAgICBwYXJlbnQsXG4gICAgICB9KSxcbiAgfSxcbiAgSW52b2ljZU11dGF0aW9uOiB7XG4gICAgY3JlYXRlSW52b2ljZTogKHBhcmVudCwgYXJncywgY29udGV4dCkgPT5cbiAgICAgIGludm9pY2VTZXJ2aWNlLmNyZWF0ZUNyeXN0YWxsaXplT3JkZXIoe1xuICAgICAgICAuLi5hcmdzLFxuICAgICAgICBjb250ZXh0LFxuICAgICAgICBwYXJlbnQsXG4gICAgICB9KSxcbiAgfSxcbn07XG4iLCJjb25zdCBncWwgPSByZXF1aXJlKFwiZ3JhcGhxbC10YWdcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZ3FsYFxuICBzY2FsYXIgSlNPTlxuXG4gIHR5cGUgUXVlcnkge1xuICAgIG15Q3VzdG9tQnVzaW5lc3NUaGluZzogTXlDdXN0b21CdXNpbm5lc3NRdWVyaWVzIVxuICAgIGJhc2tldChiYXNrZXRNb2RlbDogQmFza2V0TW9kZWxJbnB1dCEpOiBCYXNrZXQhXG4gICAgdXNlcjogVXNlciFcbiAgICBwYXltZW50UHJvdmlkZXJzOiBQYXltZW50UHJvdmlkZXJzUXVlcmllcyFcbiAgICBvcmRlcnM6IE9yZGVyUXVlcmllcyFcbiAgICB2b3VjaGVyKGNvZGU6IFN0cmluZyEpOiBWb3VjaGVyUmVzcG9uc2UhXG4gIH1cblxuICB0eXBlIFZvdWNoZXJSZXNwb25zZSB7XG4gICAgdm91Y2hlcjogVm91Y2hlclxuICAgIGlzVmFsaWQ6IEJvb2xlYW4hXG4gIH1cblxuICB0eXBlIE15Q3VzdG9tQnVzaW5uZXNzUXVlcmllcyB7XG4gICAgd2hhdElzVGhpczogU3RyaW5nIVxuICAgIGR5bmFtaWNSYW5kb21JbnQ6IEludCFcbiAgfVxuXG4gIHR5cGUgQmFza2V0IHtcbiAgICBjYXJ0OiBbQ2FydEl0ZW0hXSFcbiAgICB0b3RhbDogUHJpY2UhXG4gICAgdm91Y2hlcjogVm91Y2hlclxuICB9XG5cbiAgdHlwZSBDYXJ0SXRlbSB7XG4gICAgc2t1OiBTdHJpbmchXG4gICAgbmFtZTogU3RyaW5nXG4gICAgcGF0aDogU3RyaW5nXG4gICAgcXVhbnRpdHk6IEludCFcbiAgICB2YXRUeXBlOiBWYXRUeXBlXG4gICAgc3RvY2s6IEludFxuICAgIHByaWNlOiBQcmljZVxuICAgIHByaWNlVmFyaWFudHM6IFtQcmljZVZhcmlhbnQhXVxuICAgIGF0dHJpYnV0ZXM6IFtBdHRyaWJ1dGUhXVxuICAgIGltYWdlczogW0ltYWdlIV1cbiAgfVxuXG4gIHR5cGUgUHJpY2VWYXJpYW50IHtcbiAgICBwcmljZTogRmxvYXRcbiAgICBpZGVudGlmaWVyOiBTdHJpbmchXG4gICAgY3VycmVuY3k6IFN0cmluZyFcbiAgfVxuXG4gIHR5cGUgQXR0cmlidXRlIHtcbiAgICBhdHRyaWJ1dGU6IFN0cmluZyFcbiAgICB2YWx1ZTogU3RyaW5nXG4gIH1cblxuICB0eXBlIEltYWdlIHtcbiAgICB1cmw6IFN0cmluZyFcbiAgICB2YXJpYW50czogW0ltYWdlVmFyaWFudCFdXG4gIH1cblxuICB0eXBlIEltYWdlVmFyaWFudCB7XG4gICAgdXJsOiBTdHJpbmchXG4gICAgd2lkdGg6IEludFxuICAgIGhlaWdodDogSW50XG4gIH1cblxuICB0eXBlIFByaWNlIHtcbiAgICBncm9zczogRmxvYXQhXG4gICAgbmV0OiBGbG9hdCFcbiAgICBjdXJyZW5jeTogU3RyaW5nXG4gICAgdGF4OiBUYXhcbiAgICB0YXhBbW91bnQ6IEZsb2F0XG4gICAgZGlzY291bnQ6IEZsb2F0IVxuICB9XG5cbiAgdHlwZSBUYXgge1xuICAgIG5hbWU6IFN0cmluZ1xuICAgIHBlcmNlbnQ6IEZsb2F0XG4gIH1cblxuICB0eXBlIFZhdFR5cGUge1xuICAgIG5hbWU6IFN0cmluZyFcbiAgICBwZXJjZW50OiBJbnQhXG4gIH1cblxuICB0eXBlIFVzZXIge1xuICAgIGxvZ291dExpbms6IFN0cmluZyFcbiAgICBpc0xvZ2dlZEluOiBCb29sZWFuIVxuICAgIGVtYWlsOiBTdHJpbmdcbiAgICBmaXJzdE5hbWU6IFN0cmluZ1xuICAgIG1pZGRsZU5hbWU6IFN0cmluZ1xuICAgIGxhc3ROYW1lOiBTdHJpbmdcbiAgICBtZXRhOiBbS2V5VmFsdWVQYWlyIV1cbiAgfVxuXG4gIHR5cGUgUGF5bWVudFByb3ZpZGVyc1F1ZXJpZXMge1xuICAgIHN0cmlwZTogUGF5bWVudFByb3ZpZGVyIVxuICAgIGtsYXJuYTogUGF5bWVudFByb3ZpZGVyIVxuICAgIHZpcHBzOiBQYXltZW50UHJvdmlkZXIhXG4gICAgbW9sbGllOiBQYXltZW50UHJvdmlkZXIhXG4gICAgcGF5cGFsOiBQYXltZW50UHJvdmlkZXIhXG4gICAgaW52b2ljZTogUGF5bWVudFByb3ZpZGVyIVxuICB9XG5cbiAgdHlwZSBQYXltZW50UHJvdmlkZXIge1xuICAgIGVuYWJsZWQ6IEJvb2xlYW4hXG4gICAgY29uZmlnOiBKU09OXG4gIH1cblxuICB0eXBlIE9yZGVyUXVlcmllcyB7XG4gICAgZ2V0KGlkOiBTdHJpbmchKTogSlNPTlxuICB9XG5cbiAgdHlwZSBWb3VjaGVyIHtcbiAgICBjb2RlOiBTdHJpbmchXG4gICAgZGlzY291bnRBbW91bnQ6IEludFxuICAgIGRpc2NvdW50UGVyY2VudDogRmxvYXRcbiAgfVxuXG4gIHR5cGUgTXV0YXRpb24ge1xuICAgIHVzZXI6IFVzZXJNdXRhdGlvbnNcbiAgICBwYXltZW50UHJvdmlkZXJzOiBQYXltZW50UHJvdmlkZXJzTXV0YXRpb25zIVxuICB9XG5cbiAgaW5wdXQgQmFza2V0TW9kZWxJbnB1dCB7XG4gICAgbG9jYWxlOiBMb2NhbGVJbnB1dCFcbiAgICBjYXJ0OiBbU2ltcGxlQ2FydEl0ZW0hXSFcbiAgICB2b3VjaGVyQ29kZTogU3RyaW5nXG4gICAgY3J5c3RhbGxpemVPcmRlcklkOiBTdHJpbmdcbiAgICBrbGFybmFPcmRlcklkOiBTdHJpbmdcbiAgfVxuXG4gIGlucHV0IExvY2FsZUlucHV0IHtcbiAgICBsb2NhbGU6IFN0cmluZyFcbiAgICBkaXNwbGF5TmFtZTogU3RyaW5nXG4gICAgYXBwTGFuZ3VhZ2U6IFN0cmluZyFcbiAgICBjcnlzdGFsbGl6ZUNhdGFsb2d1ZUxhbmd1YWdlOiBTdHJpbmdcbiAgICBjcnlzdGFsbGl6ZVByaWNlVmFyaWFudDogU3RyaW5nXG4gIH1cblxuICBpbnB1dCBTaW1wbGVDYXJ0SXRlbSB7XG4gICAgc2t1OiBTdHJpbmchXG4gICAgcGF0aDogU3RyaW5nXG4gICAgcXVhbnRpdHk6IEludFxuICAgIHByaWNlVmFyaWFudElkZW50aWZpZXI6IFN0cmluZyFcbiAgfVxuXG4gIHR5cGUgVXNlck11dGF0aW9ucyB7XG4gICAgc2VuZE1hZ2ljTGluayhcbiAgICAgIGVtYWlsOiBTdHJpbmchXG4gICAgICByZWRpcmVjdFVSTEFmdGVyTG9naW46IFN0cmluZyFcbiAgICApOiBTZW5kTWFnaWNMaW5rUmVzcG9uc2UhXG4gICAgdXBkYXRlKGlucHV0OiBVc2VyVXBkYXRlSW5wdXQhKTogVXNlciFcbiAgfVxuXG4gIGlucHV0IFVzZXJVcGRhdGVJbnB1dCB7XG4gICAgZmlyc3ROYW1lOiBTdHJpbmdcbiAgICBtaWRkbGVOYW1lOiBTdHJpbmdcbiAgICBsYXN0TmFtZTogU3RyaW5nXG4gICAgbWV0YTogW0tleVZhbHVlUGFpcklucHV0IV1cbiAgfVxuXG4gIHR5cGUgU2VuZE1hZ2ljTGlua1Jlc3BvbnNlIHtcbiAgICBzdWNjZXNzOiBCb29sZWFuIVxuICAgIGVycm9yOiBTdHJpbmdcbiAgfVxuXG4gIGlucHV0IENoZWNrb3V0TW9kZWxJbnB1dCB7XG4gICAgYmFza2V0TW9kZWw6IEJhc2tldE1vZGVsSW5wdXQhXG4gICAgY3VzdG9tZXI6IE9yZGVyQ3VzdG9tZXJJbnB1dFxuICAgIGNvbmZpcm1hdGlvblVSTDogU3RyaW5nIVxuICAgIGNoZWNrb3V0VVJMOiBTdHJpbmchXG4gICAgdGVybXNVUkw6IFN0cmluZyFcbiAgfVxuXG4gIGlucHV0IE9yZGVyQ3VzdG9tZXJJbnB1dCB7XG4gICAgZmlyc3ROYW1lOiBTdHJpbmdcbiAgICBsYXN0TmFtZTogU3RyaW5nXG4gICAgYWRkcmVzc2VzOiBbQWRkcmVzc0lucHV0IV1cbiAgfVxuXG4gIGlucHV0IEFkZHJlc3NJbnB1dCB7XG4gICAgdHlwZTogU3RyaW5nXG4gICAgZW1haWw6IFN0cmluZ1xuICAgIGZpcnN0TmFtZTogU3RyaW5nXG4gICAgbWlkZGxlTmFtZTogU3RyaW5nXG4gICAgbGFzdE5hbWU6IFN0cmluZ1xuICAgIHN0cmVldDogU3RyaW5nXG4gICAgc3RyZWV0MjogU3RyaW5nXG4gICAgc3RyZWV0TnVtYmVyOiBTdHJpbmdcbiAgICBwb3N0YWxDb2RlOiBTdHJpbmdcbiAgICBjaXR5OiBTdHJpbmdcbiAgICBzdGF0ZTogU3RyaW5nXG4gICAgY291bnRyeTogU3RyaW5nXG4gICAgcGhvbmU6IFN0cmluZ1xuICB9XG5cbiAgdHlwZSBQYXltZW50UHJvdmlkZXJzTXV0YXRpb25zIHtcbiAgICBzdHJpcGU6IFN0cmlwZU11dGF0aW9ucyFcbiAgICBrbGFybmE6IEtsYXJuYU11dGF0aW9ucyFcbiAgICBtb2xsaWU6IE1vbGxpZU11dGF0aW9ucyFcbiAgICB2aXBwczogVmlwcHNNdXRhdGlvbnMhXG4gICAgcGF5cGFsOiBQYXlwYWxNdXRhdGlvbiFcbiAgICBpbnZvaWNlOiBJbnZvaWNlTXV0YXRpb24hXG4gIH1cblxuICB0eXBlIFN0cmlwZU11dGF0aW9ucyB7XG4gICAgY3JlYXRlUGF5bWVudEludGVudChcbiAgICAgIGNoZWNrb3V0TW9kZWw6IENoZWNrb3V0TW9kZWxJbnB1dCFcbiAgICAgIGNvbmZpcm06IEJvb2xlYW5cbiAgICAgIHBheW1lbnRNZXRob2RJZDogU3RyaW5nXG4gICAgKTogSlNPTlxuICAgIGNvbmZpcm1PcmRlcihcbiAgICAgIGNoZWNrb3V0TW9kZWw6IENoZWNrb3V0TW9kZWxJbnB1dCFcbiAgICAgIHBheW1lbnRJbnRlbnRJZDogU3RyaW5nIVxuICAgICk6IFN0cmlwZUNvbmZpcm1PcmRlclJlc3BvbnNlIVxuICB9XG5cbiAgdHlwZSBTdHJpcGVDb25maXJtT3JkZXJSZXNwb25zZSB7XG4gICAgc3VjY2VzczogQm9vbGVhbiFcbiAgICBvcmRlcklkOiBTdHJpbmdcbiAgfVxuXG4gIHR5cGUgS2xhcm5hTXV0YXRpb25zIHtcbiAgICByZW5kZXJDaGVja291dChcbiAgICAgIGNoZWNrb3V0TW9kZWw6IENoZWNrb3V0TW9kZWxJbnB1dCFcbiAgICApOiBLbGFybmFSZW5kZXJDaGVja291dFJlcG9uc2UhXG4gIH1cblxuICB0eXBlIEtsYXJuYVJlbmRlckNoZWNrb3V0UmVwb25zZSB7XG4gICAgaHRtbDogU3RyaW5nIVxuICAgIGtsYXJuYU9yZGVySWQ6IFN0cmluZyFcbiAgICBjcnlzdGFsbGl6ZU9yZGVySWQ6IFN0cmluZyFcbiAgfVxuXG4gIHR5cGUgTW9sbGllTXV0YXRpb25zIHtcbiAgICBjcmVhdGVQYXltZW50KFxuICAgICAgY2hlY2tvdXRNb2RlbDogQ2hlY2tvdXRNb2RlbElucHV0IVxuICAgICk6IE1vbGxpZUNyZWF0ZVBheW1lbnRSZXNwb25zZSFcbiAgfVxuXG4gIHR5cGUgTW9sbGllQ3JlYXRlUGF5bWVudFJlc3BvbnNlIHtcbiAgICBzdWNjZXNzOiBCb29sZWFuIVxuICAgIGNoZWNrb3V0TGluazogU3RyaW5nXG4gICAgY3J5c3RhbGxpemVPcmRlcklkOiBTdHJpbmchXG4gIH1cblxuICB0eXBlIFZpcHBzTXV0YXRpb25zIHtcbiAgICBpbml0aWF0ZVBheW1lbnQoXG4gICAgICBjaGVja291dE1vZGVsOiBDaGVja291dE1vZGVsSW5wdXQhXG4gICAgKTogVmlwcHNJbml0aWF0ZVBheW1lbnRSZXNwb25zZSFcbiAgfVxuXG4gIHR5cGUgVmlwcHNJbml0aWF0ZVBheW1lbnRSZXNwb25zZSB7XG4gICAgc3VjY2VzczogQm9vbGVhbiFcbiAgICBjaGVja291dExpbms6IFN0cmluZ1xuICAgIGNyeXN0YWxsaXplT3JkZXJJZDogU3RyaW5nIVxuICB9XG5cbiAgdHlwZSBQYXlwYWxNdXRhdGlvbiB7XG4gICAgY3JlYXRlUGF5bWVudChjaGVja291dE1vZGVsOiBDaGVja291dE1vZGVsSW5wdXQhKTogUGF5cGFsUGF5bWVudFJlc3BvbnNlIVxuICAgIGNvbmZpcm1QYXltZW50KFxuICAgICAgY2hlY2tvdXRNb2RlbDogQ2hlY2tvdXRNb2RlbElucHV0IVxuICAgICAgb3JkZXJJZDogU3RyaW5nXG4gICAgKTogUGF5cGFsUGF5bWVudFJlc3BvbnNlIVxuICB9XG5cbiAgdHlwZSBQYXlwYWxQYXltZW50UmVzcG9uc2Uge1xuICAgIHN1Y2Nlc3M6IEJvb2xlYW4hXG4gICAgb3JkZXJJZDogU3RyaW5nXG4gIH1cblxuICB0eXBlIEludm9pY2VNdXRhdGlvbiB7XG4gICAgY3JlYXRlSW52b2ljZShjaGVja291dE1vZGVsOiBDaGVja291dE1vZGVsSW5wdXQhKTogQ3JlYXRlSW52b2ljZU11dGF0aW9uIVxuICB9XG5cbiAgdHlwZSBDcmVhdGVJbnZvaWNlTXV0YXRpb24ge1xuICAgIHN1Y2Nlc3M6IEJvb2xlYW4hXG4gICAgb3JkZXJJZDogU3RyaW5nXG4gIH1cblxuICB0eXBlIEtleVZhbHVlUGFpciB7XG4gICAga2V5OiBTdHJpbmchXG4gICAgdmFsdWU6IFN0cmluZ1xuICB9XG5cbiAgaW5wdXQgS2V5VmFsdWVQYWlySW5wdXQge1xuICAgIGtleTogU3RyaW5nIVxuICAgIHZhbHVlOiBTdHJpbmdcbiAgfVxuYDtcbiIsImZ1bmN0aW9uIGZvcm1hdEN1cnJlbmN5KHsgYW1vdW50LCBjdXJyZW5jeSB9KSB7XG4gIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoXCJlbi1VU1wiLCB7IHN0eWxlOiBcImN1cnJlbmN5XCIsIGN1cnJlbmN5IH0pLmZvcm1hdChcbiAgICBhbW91bnRcbiAgKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGZvcm1hdEN1cnJlbmN5LFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0SG9zdCh7IGhlYWRlcnMgfSkge1xuICAvLyBJZiBiZWhpbmQgYSByZXZlcnNlIHByb3h5IGxpa2UgQVdTIEVsYXN0aWMgQmVhbnN0YWxrIGZvciBpbnN0YW5jZVxuICBjb25zdCB7IFwieC1mb3J3YXJkZWQtcHJvdG9cIjogeHByb3RvY29sLCBcIngtZm9yd2FyZGVkLWhvc3RcIjogeGhvc3QgfSA9IGhlYWRlcnM7XG4gIGlmICh4cHJvdG9jb2wgJiYgeGhvc3QpIHtcbiAgICByZXR1cm4gYCR7eHByb3RvY29sfTovLyR7eGhvc3R9YDtcbiAgfVxuXG4gIGlmIChwcm9jZXNzLmVudi5IT1NUX1VSTCkge1xuICAgIHJldHVybiBwcm9jZXNzLmVudi5IT1NUX1VSTDtcbiAgfVxuXG4gIGNvbnN0IHsgSG9zdCwgaG9zdCA9IEhvc3QgfSA9IGhlYWRlcnM7XG4gIGlmIChob3N0ICYmIGhvc3Quc3RhcnRzV2l0aChcImxvY2FsaG9zdFwiKSkge1xuICAgIHJldHVybiBgaHR0cDovLyR7aG9zdH1gO1xuICB9XG5cbiAgLy8gSWYgaG9zdGVkIG9uIFZlcmNlbFxuICBpZiAocHJvY2Vzcy5lbnYuVkVSQ0VMX1VSTCkge1xuICAgIHJldHVybiBgaHR0cHM6Ly8ke3Byb2Nlc3MuZW52LlZFUkNFTF9VUkx9YDtcbiAgfVxuXG4gIGlmICghaG9zdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBkZXRlcm1pbmUgaG9zdCBmb3IgdGhlIGN1cnJlbnQgcmVxdWVzdCBjb250ZXh0XCIpO1xuICB9XG5cbiAgcmV0dXJuIGBodHRwczovLyR7aG9zdH1gO1xufTtcbiIsImZ1bmN0aW9uIHRydW5jYXRlRGVjaW1hbHNPZk51bWJlcihvcmlnaW5hbE51bWJlciwgbnVtYmVyT2ZEZWNpbWFscyA9IDIpIHtcbiAgLy8gdG9GaXhlZCgpIGNvbnZlcnRzIGEgbnVtYmVyIGludG8gYSBzdHJpbmcgYnkgdHJ1bmNhdGluZyBpdFxuICAvLyB3aXRoIHRoZSBudW1iZXIgb2YgZGVjaW1hbHMgcGFzc2VkIGFzIHBhcmFtZXRlci5cbiAgY29uc3QgYW1vdW50VHJ1bmNhdGVkID0gb3JpZ2luYWxOdW1iZXIudG9GaXhlZChudW1iZXJPZkRlY2ltYWxzKTtcbiAgLy8gV2UgdXNlIHBhcnNlRmxvYXQoKSB0byByZXR1cm4gYSB0cmFuc2Zvcm0gdGhlIHN0cmluZyBpbnRvIGEgbnVtYmVyXG4gIHJldHVybiBwYXJzZUZsb2F0KGFtb3VudFRydW5jYXRlZCk7XG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZVZvdWNoZXJEaXNjb3VudEFtb3VudCh7IHZvdWNoZXIsIGFtb3VudCB9KSB7XG4gIC8vIFdlIGFzc3VtZSB0aGF0IHRoZSB2b3VjaGVyIGhhcyB0aGUgcmlnaHQgZm9ybWF0LlxuICAvLyBJdCBlaXRoZXIgaGFzIGBkaXNjb3VudFBlcmNlbnRgIG9yIGBkaXNjb3VudEFtb3VudGBcbiAgY29uc3QgaXNEaXNjb3VudEFtb3VudCA9IEJvb2xlYW4odm91Y2hlci5kaXNjb3VudEFtb3VudCk7XG5cbiAgaWYgKGlzRGlzY291bnRBbW91bnQpIHtcbiAgICByZXR1cm4gdm91Y2hlci5kaXNjb3VudEFtb3VudDtcbiAgfVxuXG4gIGNvbnN0IGFtb3VudFRvRGlzY291bnQgPSAoYW1vdW50ICogdm91Y2hlci5kaXNjb3VudFBlcmNlbnQpIC8gMTAwO1xuXG4gIHJldHVybiB0cnVuY2F0ZURlY2ltYWxzT2ZOdW1iZXIoYW1vdW50VG9EaXNjb3VudCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjYWxjdWxhdGVWb3VjaGVyRGlzY291bnRBbW91bnQsXG59O1xuIiwiLyoqXG4gKiBIYW5kbGUgbGFuZ3VhZ2Ugc3BlY2lmaWMgVkFUIHR5cGVzLlxuICogVkFUIHR5cGVzIGluIENyeXN0YWxsaXplIGdldHMgYSBuYW1lIGFuZCBhIHBlcmNlbnRhZ2UsIGFuZFxuICogeW91IGxhdGVyIGFzc2lnbiBwcm9kdWN0cyB0byB0aGUgVkFUIHR5cGVzLlxuICogVGhlIHBlcmNlbnRhZ2UgbWlnaHQgbm90IGJlIHRoZSBzYW1lIGZvciBhbGwgcmVnaW9ucywgd2hpY2hcbiAqIG1ha2VzIHRoaXMgYSBnb29kIHBsYWNlIHRvIG1ha2UgYW55IG92ZXJyaWRlcyBpZiBuZWVkZWQuXG4gKi9cbmNvbnN0IFZBVE92ZXJyaWRlcyA9IFtcbiAge1xuICAgIGxvY2FsZTogXCI/P1wiLCAvLyBcInRoZSBsb2NhbGUubG9jYWxlIGZyb20gdGhlIHN0b3JlZnJvbnQgbG9jYWxlcyBoZXJlIChleGFtcGxlOiBlbilcIlxuICAgIHZhdFR5cGVzOiBbXG4gICAgICB7XG4gICAgICAgIG5hbWU6IFwiU3RhbmRhcmRcIixcbiAgICAgICAgcGVyY2VudDogNTAsXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG5dO1xuXG4vKipcbiAqIEdldHMgaW5mb3JtYXRpb24gZm9yIHByb2R1Y3RzIHVzaW5nIFNLVSBmb3IgbG9va3VwLlxuICovXG5hc3luYyBmdW5jdGlvbiBnZXRQcm9kdWN0c0Zyb21DcnlzdGFsbGl6ZSh7IHNrdXMsIGxvY2FsZSB9KSB7XG4gIGlmIChza3VzLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IGxhbmd1YWdlID0gbG9jYWxlLmNyeXN0YWxsaXplQ2F0YWxvZ3VlTGFuZ3VhZ2U7XG5cbiAgY29uc3QgeyBjYWxsQ2F0YWxvZ3VlQXBpLCBjYWxsU2VhcmNoQXBpIH0gPSByZXF1aXJlKFwiLi4vY3J5c3RhbGxpemUvdXRpbHNcIik7XG5cbiAgY29uc3QgcGF0aHNTZXQgPSBuZXcgU2V0KCk7XG4gIGxldCBzZWFyY2hBZnRlckN1cnNvcjtcbiAgYXN5bmMgZnVuY3Rpb24gZ2V0TmV4dFNlYXJjaFBhZ2UoKSB7XG4gICAgY29uc3Qgc2VhcmNoQVBJUmVzcG9uc2UgPSBhd2FpdCBjYWxsU2VhcmNoQXBpKHtcbiAgICAgIHF1ZXJ5OiBgXG4gICAgICAgIHF1ZXJ5IEdFVF9QUk9EVUNUU19CWV9TS1UgKCRza3VzOiBbU3RyaW5nIV0sICRhZnRlcjogU3RyaW5nLCAkbGFuZ3VhZ2U6IFN0cmluZyEpIHtcbiAgICAgICAgICBzZWFyY2ggKFxuICAgICAgICAgICAgYWZ0ZXI6ICRhZnRlclxuICAgICAgICAgICAgbGFuZ3VhZ2U6ICRsYW5ndWFnZVxuICAgICAgICAgICAgZmlsdGVyOiB7XG4gICAgICAgICAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgICAgICAgICBza3VzOiAkc2t1c1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBwYWdlSW5mbyB7XG4gICAgICAgICAgICAgIGVuZEN1cnNvclxuICAgICAgICAgICAgICBoYXNOZXh0UGFnZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWRnZXMge1xuICAgICAgICAgICAgICBub2RlIHtcbiAgICAgICAgICAgICAgICBwYXRoXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIGAsXG4gICAgICB2YXJpYWJsZXM6IHtcbiAgICAgICAgc2t1cyxcbiAgICAgICAgYWZ0ZXI6IHNlYXJjaEFmdGVyQ3Vyc29yLFxuICAgICAgICBsYW5ndWFnZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICBjb25zdCB7IGVkZ2VzLCBwYWdlSW5mbyB9ID0gc2VhcmNoQVBJUmVzcG9uc2UuZGF0YT8uc2VhcmNoIHx8IHt9O1xuXG4gICAgZWRnZXM/LmZvckVhY2goKGVkZ2UpID0+IHBhdGhzU2V0LmFkZChlZGdlLm5vZGUucGF0aCkpO1xuXG4gICAgaWYgKHBhZ2VJbmZvPy5oYXNOZXh0UGFnZSkge1xuICAgICAgc2VhcmNoQWZ0ZXJDdXJzb3IgPSBwYWdlSW5mby5lbmRDdXJzb3I7XG4gICAgICBhd2FpdCBnZXROZXh0U2VhcmNoUGFnZSgpO1xuICAgIH1cbiAgfVxuXG4gIGF3YWl0IGdldE5leHRTZWFyY2hQYWdlKCk7XG5cbiAgLyoqXG4gICAqIEVucmljaCBlYWNoIHByb2R1Y3Qgd2l0aCBtb3JlIGluZm9ybWF0aW9uXG4gICAqIEdldHMgYWxsIG9mIHRoZSBwcm9kdWN0cyB3aXRoIGEgc2luZ2xlIHJlcXVlc3RcbiAgICogYnkgY29tcG9zaW5nIHRoZSBxdWVyeSBkeW5hbWljYWxseVxuICAgKi9cbiAgY29uc3QgcGF0aHMgPSBBcnJheS5mcm9tKHBhdGhzU2V0KTtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjYWxsQ2F0YWxvZ3VlQXBpKHtcbiAgICBxdWVyeTogYHtcbiAgICAgICR7cGF0aHMubWFwKFxuICAgICAgICAocGF0aCwgaW5kZXgpID0+IGBcbiAgICAgICAgcHJvZHVjdCR7aW5kZXh9OiBjYXRhbG9ndWUocGF0aDogXCIke3BhdGh9XCIsIGxhbmd1YWdlOiBcIiR7bGFuZ3VhZ2V9XCIpIHtcbiAgICAgICAgICBwYXRoXG4gICAgICAgICAgLi4uIG9uIFByb2R1Y3Qge1xuICAgICAgICAgICAgaWRcbiAgICAgICAgICAgIHZhdFR5cGUge1xuICAgICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICAgIHBlcmNlbnRcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhcmlhbnRzIHtcbiAgICAgICAgICAgICAgaWRcbiAgICAgICAgICAgICAgc2t1XG4gICAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgICAgc3RvY2tcbiAgICAgICAgICAgICAgcHJpY2VWYXJpYW50cyB7XG4gICAgICAgICAgICAgICAgcHJpY2VcbiAgICAgICAgICAgICAgICBpZGVudGlmaWVyXG4gICAgICAgICAgICAgICAgY3VycmVuY3lcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzIHtcbiAgICAgICAgICAgICAgICBhdHRyaWJ1dGVcbiAgICAgICAgICAgICAgICB2YWx1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGltYWdlcyB7XG4gICAgICAgICAgICAgICAgdXJsXG4gICAgICAgICAgICAgICAgdmFyaWFudHMge1xuICAgICAgICAgICAgICAgICAgdXJsXG4gICAgICAgICAgICAgICAgICB3aWR0aFxuICAgICAgICAgICAgICAgICAgaGVpZ2h0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICBgXG4gICAgICApfVxuICAgIH1gLFxuICB9KTtcblxuICBjb25zdCB2YXRUeXBlT3ZlcnJpZGVzRm9yTG9jYWxlID0gVkFUT3ZlcnJpZGVzLmZpbmQoXG4gICAgKHYpID0+IHYubG9jYWxlID09PSBsb2NhbGUubG9jYWxlXG4gICk7XG5cbiAgcmV0dXJuIHBhdGhzXG4gICAgLm1hcCgoXywgaSkgPT4gcmVzcG9uc2UuZGF0YVtgcHJvZHVjdCR7aX1gXSlcbiAgICAuZmlsdGVyKChwKSA9PiAhIXApXG4gICAgLm1hcChmdW5jdGlvbiBkb1ZBVE92ZXJyaWRlKHByb2R1Y3QpIHtcbiAgICAgIGNvbnN0IHZhdFR5cGVPdmVycmlkZSA9IHZhdFR5cGVPdmVycmlkZXNGb3JMb2NhbGU/LnZhdFR5cGVzLmZpbmQoXG4gICAgICAgICh2KSA9PiB2Lm5hbWUgPT09IHByb2R1Y3QudmF0VHlwZS5uYW1lXG4gICAgICApO1xuICAgICAgaWYgKHZhdFR5cGVPdmVycmlkZSkge1xuICAgICAgICBwcm9kdWN0LnZhdFR5cGUgPSB2YXRUeXBlT3ZlcnJpZGU7XG4gICAgICB9XG4gICAgICByZXR1cm4gcHJvZHVjdDtcbiAgICB9KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldFByb2R1Y3RzRnJvbUNyeXN0YWxsaXplLFxufTtcbiIsIi8vIENhbGN1bGF0ZSB0aGUgdG90YWxzXG5mdW5jdGlvbiBnZXRUb3RhbHMoeyBjYXJ0LCB2YXRUeXBlIH0pIHtcbiAgcmV0dXJuIGNhcnQucmVkdWNlKFxuICAgIChhY2MsIGN1cnIpID0+IHtcbiAgICAgIGNvbnN0IHsgcXVhbnRpdHksIHByaWNlIH0gPSBjdXJyO1xuICAgICAgaWYgKHByaWNlKSB7XG4gICAgICAgIGNvbnN0IHByaWNlVG9Vc2UgPSBwcmljZS5kaXNjb3VudGVkIHx8IHByaWNlO1xuICAgICAgICBhY2MuZ3Jvc3MgKz0gcHJpY2VUb1VzZS5ncm9zcyAqIHF1YW50aXR5O1xuICAgICAgICBhY2MubmV0ICs9IHByaWNlVG9Vc2UubmV0ICogcXVhbnRpdHk7XG4gICAgICAgIGFjYy5jdXJyZW5jeSA9IHByaWNlLmN1cnJlbmN5O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sXG4gICAgeyBncm9zczogMCwgbmV0OiAwLCB0YXg6IHZhdFR5cGUsIGRpc2NvdW50OiAwLCBjdXJyZW5jeTogXCJOL0FcIiB9XG4gICk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBhc3luYyBnZXQoeyBiYXNrZXRNb2RlbCwgY29udGV4dCB9KSB7XG4gICAgY29uc3QgeyBsb2NhbGUsIHZvdWNoZXJDb2RlLCAuLi5iYXNrZXRGcm9tQ2xpZW50IH0gPSBiYXNrZXRNb2RlbDtcblxuICAgIC8qKlxuICAgICAqIFJlc29sdmUgYWxsIHRoZSB2b3VjaGVyIGNvZGVzIHRvIHZhbGlkIHZvdWNoZXJzIGZvciB0aGUgdXNlclxuICAgICAqL1xuICAgIGxldCB2b3VjaGVyO1xuICAgIGlmICh2b3VjaGVyQ29kZSkge1xuICAgICAgY29uc3Qgdm91Y2hlclNlcnZpY2UgPSByZXF1aXJlKFwiLi4vdm91Y2hlci1zZXJ2aWNlXCIpO1xuICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCB2b3VjaGVyU2VydmljZS5nZXQoeyBjb2RlOiB2b3VjaGVyQ29kZSwgY29udGV4dCB9KTtcblxuICAgICAgaWYgKHJlc3BvbnNlLmlzVmFsaWQpIHtcbiAgICAgICAgdm91Y2hlciA9IHJlc3BvbnNlLnZvdWNoZXI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogR2V0IGFsbCBwcm9kdWN0cyBmcm9tIENyeXN0YWxsaXplXG4gICAgICovXG4gICAgY29uc3Qge1xuICAgICAgZ2V0UHJvZHVjdHNGcm9tQ3J5c3RhbGxpemUsXG4gICAgfSA9IHJlcXVpcmUoXCIuL2dldC1wcm9kdWN0cy1mcm9tLWNyeXN0YWxsaXplXCIpO1xuICAgIGNvbnN0IHByb2R1Y3REYXRhRnJvbUNyeXN0YWxsaXplID0gYXdhaXQgZ2V0UHJvZHVjdHNGcm9tQ3J5c3RhbGxpemUoe1xuICAgICAgc2t1czogYmFza2V0RnJvbUNsaWVudC5jYXJ0Lm1hcCgocCkgPT4gcC5za3UpLFxuICAgICAgbG9jYWxlLFxuICAgIH0pO1xuXG4gICAgbGV0IHZhdFR5cGU7XG5cbiAgICAvKipcbiAgICAgKiBDb21wb3NlIHRoZSBjb21wbGV0ZSBjYXJ0IGl0ZW1zIGVucmljaGVkIHdpdGhcbiAgICAgKiBkYXRhIGZyb20gQ3J5c3RhbGxpemVcbiAgICAgKi9cbiAgICBjb25zdCBjYXJ0ID0gYmFza2V0RnJvbUNsaWVudC5jYXJ0XG4gICAgICAubWFwKChpdGVtRnJvbUNsaWVudCkgPT4ge1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gcHJvZHVjdERhdGFGcm9tQ3J5c3RhbGxpemUuZmluZCgocCkgPT5cbiAgICAgICAgICBwLnZhcmlhbnRzLnNvbWUoKHYpID0+IHYuc2t1ID09PSBpdGVtRnJvbUNsaWVudC5za3UpXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCFwcm9kdWN0KSB7XG4gICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICB2YXRUeXBlID0gcHJvZHVjdC52YXRUeXBlO1xuXG4gICAgICAgIGNvbnN0IHZhcmlhbnQgPSBwcm9kdWN0LnZhcmlhbnRzLmZpbmQoXG4gICAgICAgICAgKHYpID0+IHYuc2t1ID09PSBpdGVtRnJvbUNsaWVudC5za3VcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgeyBwcmljZSwgY3VycmVuY3kgfSA9XG4gICAgICAgICAgdmFyaWFudC5wcmljZVZhcmlhbnRzLmZpbmQoXG4gICAgICAgICAgICAocHYpID0+IHB2LmlkZW50aWZpZXIgPT09IGl0ZW1Gcm9tQ2xpZW50LnByaWNlVmFyaWFudElkZW50aWZpZXJcbiAgICAgICAgICApIHx8IHZhcmlhbnQucHJpY2VWYXJpYW50cy5maW5kKChwKSA9PiBwLmlkZW50aWZpZXIgPT09IFwiZGVmYXVsdFwiKTtcblxuICAgICAgICBjb25zdCBncm9zcyA9IHByaWNlO1xuICAgICAgICBjb25zdCBuZXQgPSAocHJpY2UgKiAxMDApIC8gKDEwMCArIHZhdFR5cGUucGVyY2VudCk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwcm9kdWN0SWQ6IHByb2R1Y3QuaWQsXG4gICAgICAgICAgcHJvZHVjdFZhcmlhbnRJZDogdmFyaWFudC5pZCxcbiAgICAgICAgICBwYXRoOiBwcm9kdWN0LnBhdGgsXG4gICAgICAgICAgcXVhbnRpdHk6IGl0ZW1Gcm9tQ2xpZW50LnF1YW50aXR5IHx8IDEsXG4gICAgICAgICAgdmF0VHlwZSxcbiAgICAgICAgICBwcmljZToge1xuICAgICAgICAgICAgZ3Jvc3MsXG4gICAgICAgICAgICBuZXQsXG4gICAgICAgICAgICB0YXg6IHZhdFR5cGUsXG4gICAgICAgICAgICBjdXJyZW5jeSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIC4uLnZhcmlhbnQsXG4gICAgICAgIH07XG4gICAgICB9KVxuICAgICAgLmZpbHRlcigocCkgPT4gISFwKTtcblxuICAgIC8vIENhbGN1bGF0ZSB0aGUgdG90YWxzXG4gICAgbGV0IHRvdGFsID0gZ2V0VG90YWxzKHsgY2FydCwgdmF0VHlwZSB9KTtcblxuICAgIC8vIEFkZCBhIHZvdWNoZXJcbiAgICBsZXQgY2FydFdpdGhWb3VjaGVyID0gY2FydDtcbiAgICBpZiAoY2FydC5sZW5ndGggPiAwICYmIHZvdWNoZXIpIHtcbiAgICAgIGNvbnN0IHtcbiAgICAgICAgY2FsY3VsYXRlVm91Y2hlckRpc2NvdW50QW1vdW50LFxuICAgICAgfSA9IHJlcXVpcmUoXCIuL2NhbGN1bGF0ZS12b3VjaGVyLWRpc2NvdW50LWFtb3VudFwiKTtcbiAgICAgIGNvbnN0IGRpc2NvdW50QW1vdW50ID0gY2FsY3VsYXRlVm91Y2hlckRpc2NvdW50QW1vdW50KHtcbiAgICAgICAgdm91Y2hlcixcbiAgICAgICAgYW1vdW50OiB0b3RhbC5ncm9zcyxcbiAgICAgIH0pO1xuXG4gICAgICAvLyBSZWR1Y2UgdGhlIHByaWNlIGZvciBlYWNoIGl0ZW1cbiAgICAgIGNhcnRXaXRoVm91Y2hlciA9IGNhcnQubWFwKChjYXJ0SXRlbSkgPT4ge1xuICAgICAgICBjb25zdCBwb3J0aW9uT2ZUb3RhbCA9XG4gICAgICAgICAgKGNhcnRJdGVtLnByaWNlLmdyb3NzICogY2FydEl0ZW0ucXVhbnRpdHkpIC8gdG90YWwuZ3Jvc3M7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVhY2ggY2FydCBpdGVtIGdldHMgYSBwb3J0aW9uIG9mIHRoZSB2b3VjaGVyIHRoYXRcbiAgICAgICAgICogaXMgcmVsYXRpdmUgdG8gdGhlaXIgb3duIHBvcnRpb24gb2YgdGhlIHRvdGFsIGRpc2NvdW50XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBwb3J0aW9uT2ZEaXNjb3VudCA9IGRpc2NvdW50QW1vdW50ICogcG9ydGlvbk9mVG90YWw7XG5cbiAgICAgICAgY29uc3QgZ3Jvc3MgPVxuICAgICAgICAgIGNhcnRJdGVtLnByaWNlLmdyb3NzIC0gcG9ydGlvbk9mRGlzY291bnQgLyBjYXJ0SXRlbS5xdWFudGl0eTtcbiAgICAgICAgY29uc3QgbmV0ID0gKGdyb3NzICogMTAwKSAvICgxMDAgKyBjYXJ0SXRlbS52YXRUeXBlLnBlcmNlbnQpO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uY2FydEl0ZW0sXG4gICAgICAgICAgcHJpY2U6IHtcbiAgICAgICAgICAgIC4uLmNhcnRJdGVtLnByaWNlLFxuICAgICAgICAgICAgZ3Jvc3MsXG4gICAgICAgICAgICBuZXQsXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBBZGp1c3QgdG90YWxzXG4gICAgICB0b3RhbCA9IGdldFRvdGFscyh7IGNhcnQ6IGNhcnRXaXRoVm91Y2hlciwgdmF0VHlwZSB9KTtcbiAgICAgIHRvdGFsLmRpc2NvdW50ID0gZGlzY291bnRBbW91bnQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHZvdWNoZXIsXG4gICAgICBjYXJ0OiBjYXJ0V2l0aFZvdWNoZXIsXG4gICAgICB0b3RhbCxcbiAgICB9O1xuICB9LFxufTtcbiIsImNvbnN0IHsgY2FsbFBpbUFwaSwgZ2V0VGVuYW50SWQgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBjcmVhdGVDdXN0b21lcihjdXN0b21lcikge1xuICBjb25zdCB0ZW5hbnRJZCA9IGF3YWl0IGdldFRlbmFudElkKCk7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2FsbFBpbUFwaSh7XG4gICAgdmFyaWFibGVzOiB7XG4gICAgICBpbnB1dDoge1xuICAgICAgICB0ZW5hbnRJZCxcbiAgICAgICAgLi4uY3VzdG9tZXIsXG4gICAgICB9LFxuICAgIH0sXG4gICAgcXVlcnk6IGBcbiAgICAgIG11dGF0aW9uIGNyZWF0ZUN1c3RvbWVyKFxuICAgICAgICAkaW5wdXQ6IENyZWF0ZUN1c3RvbWVySW5wdXQhXG4gICAgICApIHtcbiAgICAgICAgY3VzdG9tZXIge1xuICAgICAgICAgIGNyZWF0ZShcbiAgICAgICAgICAgIGlucHV0OiAkaW5wdXRcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlkZW50aWZpZXJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBgLFxuICB9KTtcblxuICByZXR1cm4gcmVzcG9uc2UuZGF0YS5jdXN0b21lci5jcmVhdGU7XG59O1xuIiwiY29uc3QgeyBjYWxsUGltQXBpLCBnZXRUZW5hbnRJZCB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIGdldEN1c3RvbWVyKHsgaWRlbnRpZmllciwgZXh0ZXJuYWxSZWZlcmVuY2UgfSkge1xuICBjb25zdCB0ZW5hbnRJZCA9IGF3YWl0IGdldFRlbmFudElkKCk7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2FsbFBpbUFwaSh7XG4gICAgdmFyaWFibGVzOiB7XG4gICAgICB0ZW5hbnRJZCxcbiAgICAgIGlkZW50aWZpZXIsXG4gICAgICBleHRlcm5hbFJlZmVyZW5jZSxcbiAgICB9LFxuICAgIHF1ZXJ5OiBgXG4gICAgICBxdWVyeSBnZXRDdXN0b21lcihcbiAgICAgICAgJHRlbmFudElkOiBJRCFcbiAgICAgICAgJGlkZW50aWZpZXI6IFN0cmluZ1xuICAgICAgICAkZXh0ZXJuYWxSZWZlcmVuY2U6IEN1c3RvbWVyRXh0ZXJuYWxSZWZlcmVuY2VJbnB1dFxuICAgICAgKXtcbiAgICAgICAgY3VzdG9tZXIge1xuICAgICAgICAgIGdldChcbiAgICAgICAgICAgIHRlbmFudElkOiAkdGVuYW50SWRcbiAgICAgICAgICAgIGlkZW50aWZpZXI6ICRpZGVudGlmaWVyXG4gICAgICAgICAgICBleHRlcm5hbFJlZmVyZW5jZTogJGV4dGVybmFsUmVmZXJlbmNlXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZGVudGlmaWVyXG4gICAgICAgICAgICBmaXJzdE5hbWVcbiAgICAgICAgICAgIG1pZGRsZU5hbWVcbiAgICAgICAgICAgIGxhc3ROYW1lXG4gICAgICAgICAgICBtZXRhIHtcbiAgICAgICAgICAgICAga2V5XG4gICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgYCxcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3BvbnNlLmRhdGEuY3VzdG9tZXIuZ2V0O1xufTtcbiIsImNvbnN0IGNyZWF0ZSA9IHJlcXVpcmUoXCIuL2NyZWF0ZS1jdXN0b21lclwiKTtcbmNvbnN0IHVwZGF0ZSA9IHJlcXVpcmUoXCIuL3VwZGF0ZS1jdXN0b21lclwiKTtcbmNvbnN0IGdldCA9IHJlcXVpcmUoXCIuL2dldC1jdXN0b21lclwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGNyZWF0ZSxcbiAgdXBkYXRlLFxuICBnZXQsXG59O1xuIiwiY29uc3QgeyBjYWxsUGltQXBpLCBnZXRUZW5hbnRJZCB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZUN1c3RvbWVyKHsgaWRlbnRpZmllciwgLi4ucmVzdCB9KSB7XG4gIGNvbnN0IHRlbmFudElkID0gYXdhaXQgZ2V0VGVuYW50SWQoKTtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjYWxsUGltQXBpKHtcbiAgICB2YXJpYWJsZXM6IHtcbiAgICAgIHRlbmFudElkLFxuICAgICAgaWRlbnRpZmllcixcbiAgICAgIC4uLnJlc3QsXG4gICAgfSxcbiAgICBxdWVyeTogYFxuICAgICAgbXV0YXRpb24gdXBkYXRlQ3VzdG9tZXIoXG4gICAgICAgICR0ZW5hbnRJZDogSUQhXG4gICAgICAgICRpZGVudGlmaWVyOiBTdHJpbmchXG4gICAgICAgICRjdXN0b21lcjogVXBkYXRlQ3VzdG9tZXJJbnB1dCFcbiAgICAgICkge1xuICAgICAgICBjdXN0b21lciB7XG4gICAgICAgICAgdXBkYXRlKFxuICAgICAgICAgICAgdGVuYW50SWQ6ICR0ZW5hbnRJZFxuICAgICAgICAgICAgaWRlbnRpZmllcjogJGlkZW50aWZpZXJcbiAgICAgICAgICAgIGlucHV0OiAkY3VzdG9tZXJcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlkZW50aWZpZXJcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBgLFxuICB9KTtcblxuICByZXR1cm4gcmVzcG9uc2UuZGF0YS5jdXN0b21lci51cGRhdGU7XG59O1xuIiwiY29uc3Qgb3JkZXJzID0gcmVxdWlyZShcIi4vb3JkZXJzXCIpO1xuY29uc3QgY3VzdG9tZXJzID0gcmVxdWlyZShcIi4vY3VzdG9tZXJzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgb3JkZXJzLFxuICBjdXN0b21lcnMsXG59O1xuIiwiY29uc3QgeyBjYWxsT3JkZXJzQXBpLCBub3JtYWxpc2VPcmRlck1vZGVsIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gY3JlYXRlT3JkZXIodmFyaWFibGVzKSB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2FsbE9yZGVyc0FwaSh7XG4gICAgdmFyaWFibGVzOiBub3JtYWxpc2VPcmRlck1vZGVsKHZhcmlhYmxlcyksXG4gICAgcXVlcnk6IGBcbiAgICAgIG11dGF0aW9uIGNyZWF0ZU9yZGVyKFxuICAgICAgICAkY3VzdG9tZXI6IEN1c3RvbWVySW5wdXQhXG4gICAgICAgICRjYXJ0OiBbT3JkZXJJdGVtSW5wdXQhXSFcbiAgICAgICAgJHRvdGFsOiBQcmljZUlucHV0XG4gICAgICAgICRwYXltZW50OiBbUGF5bWVudElucHV0IV1cbiAgICAgICAgJGFkZGl0aW9uYWxJbmZvcm1hdGlvbjogU3RyaW5nXG4gICAgICAgICRtZXRhOiBbT3JkZXJNZXRhZGF0YUlucHV0IV1cbiAgICAgICkge1xuICAgICAgICBvcmRlcnMge1xuICAgICAgICAgIGNyZWF0ZShcbiAgICAgICAgICAgIGlucHV0OiB7XG4gICAgICAgICAgICAgIGN1c3RvbWVyOiAkY3VzdG9tZXJcbiAgICAgICAgICAgICAgY2FydDogJGNhcnRcbiAgICAgICAgICAgICAgdG90YWw6ICR0b3RhbFxuICAgICAgICAgICAgICBwYXltZW50OiAkcGF5bWVudFxuICAgICAgICAgICAgICBhZGRpdGlvbmFsSW5mb3JtYXRpb246ICRhZGRpdGlvbmFsSW5mb3JtYXRpb25cbiAgICAgICAgICAgICAgbWV0YTogJG1ldGFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIGlkXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgYCxcbiAgfSk7XG5cbiAgcmV0dXJuIHJlc3BvbnNlLmRhdGEub3JkZXJzLmNyZWF0ZTtcbn07XG4iLCJjb25zdCB7IGNhbGxPcmRlcnNBcGkgfSA9IHJlcXVpcmUoXCIuLi91dGlsc1wiKTtcblxubW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBnZXRPcmRlcihpZCkge1xuICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNhbGxPcmRlcnNBcGkoe1xuICAgIHZhcmlhYmxlczoge1xuICAgICAgaWQsXG4gICAgfSxcbiAgICBxdWVyeTogYFxuICAgICAgcXVlcnkgZ2V0T3JkZXIoJGlkOiBJRCEpe1xuICAgICAgICBvcmRlcnMge1xuICAgICAgICAgIGdldChpZDogJGlkKSB7XG4gICAgICAgICAgICBpZFxuICAgICAgICAgICAgdG90YWwge1xuICAgICAgICAgICAgICBuZXRcbiAgICAgICAgICAgICAgZ3Jvc3NcbiAgICAgICAgICAgICAgY3VycmVuY3lcbiAgICAgICAgICAgICAgdGF4IHtcbiAgICAgICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICAgICAgcGVyY2VudFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZXRhIHtcbiAgICAgICAgICAgICAga2V5XG4gICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhZGRpdGlvbmFsSW5mb3JtYXRpb25cbiAgICAgICAgICAgIHBheW1lbnQge1xuICAgICAgICAgICAgICAuLi4gb24gU3RyaXBlUGF5bWVudCB7XG4gICAgICAgICAgICAgICAgcHJvdmlkZXJcbiAgICAgICAgICAgICAgICBwYXltZW50TWV0aG9kXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLi4uIG9uIFBheXBhbFBheW1lbnQge1xuICAgICAgICAgICAgICAgIHByb3ZpZGVyXG4gICAgICAgICAgICAgICAgb3JkZXJJZFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC4uLiBvbiBDdXN0b21QYXltZW50IHtcbiAgICAgICAgICAgICAgICBwcm92aWRlclxuICAgICAgICAgICAgICAgIHByb3BlcnRpZXMge1xuICAgICAgICAgICAgICAgICAgcHJvcGVydHlcbiAgICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC4uLiBvbiBLbGFybmFQYXltZW50IHtcbiAgICAgICAgICAgICAgICBwcm92aWRlclxuICAgICAgICAgICAgICAgIG9yZGVySWRcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FydCB7XG4gICAgICAgICAgICAgIHNrdVxuICAgICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICAgIHF1YW50aXR5XG4gICAgICAgICAgICAgIGltYWdlVXJsXG4gICAgICAgICAgICAgIHByaWNlIHtcbiAgICAgICAgICAgICAgICBuZXRcbiAgICAgICAgICAgICAgICBncm9zc1xuICAgICAgICAgICAgICAgIGN1cnJlbmN5XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgbWV0YSB7XG4gICAgICAgICAgICAgICAga2V5XG4gICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY3VzdG9tZXIge1xuICAgICAgICAgICAgICBpZGVudGlmaWVyXG4gICAgICAgICAgICAgIGZpcnN0TmFtZVxuICAgICAgICAgICAgICBtaWRkbGVOYW1lXG4gICAgICAgICAgICAgIGxhc3ROYW1lXG4gICAgICAgICAgICAgIGJpcnRoRGF0ZVxuICAgICAgICAgICAgICBjb21wYW55TmFtZVxuICAgICAgICAgICAgICB0YXhOdW1iZXJcbiAgICAgICAgICAgICAgYWRkcmVzc2VzIHtcbiAgICAgICAgICAgICAgICB0eXBlXG4gICAgICAgICAgICAgICAgZmlyc3ROYW1lXG4gICAgICAgICAgICAgICAgbWlkZGxlTmFtZVxuICAgICAgICAgICAgICAgIGxhc3ROYW1lXG4gICAgICAgICAgICAgICAgc3RyZWV0XG4gICAgICAgICAgICAgICAgc3RyZWV0MlxuICAgICAgICAgICAgICAgIHN0cmVldE51bWJlclxuICAgICAgICAgICAgICAgIHBvc3RhbENvZGVcbiAgICAgICAgICAgICAgICBjaXR5XG4gICAgICAgICAgICAgICAgc3RhdGVcbiAgICAgICAgICAgICAgICBjb3VudHJ5XG4gICAgICAgICAgICAgICAgcGhvbmVcbiAgICAgICAgICAgICAgICBlbWFpbFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgYCxcbiAgfSk7XG5cbiAgY29uc3Qgb3JkZXIgPSByZXNwb25zZS5kYXRhLm9yZGVycy5nZXQ7XG5cbiAgaWYgKCFvcmRlcikge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IHJldHJpZXZlIG9yZGVyIFwiJHtpZH1cImApO1xuICB9XG5cbiAgcmV0dXJuIG9yZGVyO1xufTtcbiIsImNvbnN0IGNyZWF0ZSA9IHJlcXVpcmUoXCIuL2NyZWF0ZS1vcmRlclwiKTtcbmNvbnN0IHVwZGF0ZSA9IHJlcXVpcmUoXCIuL3VwZGF0ZS1vcmRlclwiKTtcbmNvbnN0IGdldCA9IHJlcXVpcmUoXCIuL2dldC1vcmRlclwiKTtcbmNvbnN0IHdhaXRGb3JPcmRlclRvQmVQZXJzaXN0YXRlZCA9IHJlcXVpcmUoXCIuL3dhaXQtZm9yLW9yZGVyLXRvLWJlLXBlcnNpc3RhdGVkXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgY3JlYXRlLFxuICB1cGRhdGUsXG4gIGdldCxcbiAgd2FpdEZvck9yZGVyVG9CZVBlcnNpc3RhdGVkLFxufTtcbiIsImNvbnN0IHsgY2FsbFBpbUFwaSwgbm9ybWFsaXNlT3JkZXJNb2RlbCB9ID0gcmVxdWlyZShcIi4uL3V0aWxzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZU9yZGVyKGlkLCB2YXJpYWJsZXMpIHtcbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjYWxsUGltQXBpKHtcbiAgICB2YXJpYWJsZXM6IHtcbiAgICAgIGlkLFxuICAgICAgaW5wdXQ6IG5vcm1hbGlzZU9yZGVyTW9kZWwodmFyaWFibGVzKSxcbiAgICB9LFxuICAgIHF1ZXJ5OiBgXG4gICAgICBtdXRhdGlvbiB1cGRhdGVPcmRlcihcbiAgICAgICAgJGlkOiBJRCFcbiAgICAgICAgJGlucHV0OiBVcGRhdGVPcmRlcklucHV0IVxuICAgICAgKSB7XG4gICAgICAgIG9yZGVyIHtcbiAgICAgICAgICAgIHVwZGF0ZShcbiAgICAgICAgICAgIGlkOiAkaWQsXG4gICAgICAgICAgICBpbnB1dDogJGlucHV0XG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBpZFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICBgLFxuICB9KTtcblxuICByZXR1cm4gcmVzcG9uc2UuZGF0YS5vcmRlci51cGRhdGU7XG59O1xuIiwiY29uc3QgeyBjYWxsT3JkZXJzQXBpIH0gPSByZXF1aXJlKFwiLi4vdXRpbHNcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gd2FpdEZvck9yZGVyVG9CZVBlcnNpc3RhdGVkKHsgaWQgfSkge1xuICBsZXQgcmV0cmllcyA9IDA7XG4gIGNvbnN0IG1heFJldHJpZXMgPSAxMDtcblxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIChhc3luYyBmdW5jdGlvbiBjaGVjaygpIHtcbiAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2FsbE9yZGVyc0FwaSh7XG4gICAgICAgIHF1ZXJ5OiBgXG4gICAgICAgICAge1xuICAgICAgICAgICAgb3JkZXJzIHtcbiAgICAgICAgICAgICAgZ2V0KGlkOiBcIiR7aWR9XCIpIHtcbiAgICAgICAgICAgICAgICBpZFxuICAgICAgICAgICAgICAgIGNyZWF0ZWRBdFxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICBgLFxuICAgICAgfSk7XG5cbiAgICAgIGlmIChyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEub3JkZXJzLmdldCkge1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXRyaWVzICs9IDE7XG4gICAgICAgIGlmIChyZXRyaWVzID4gbWF4UmV0cmllcykge1xuICAgICAgICAgIHJlamVjdChcbiAgICAgICAgICAgIGBUaW1lb3V0IG91dCB3YWl0aW5nIGZvciBDcnlzdGFsbGl6ZSBvcmRlciBcIiR7aWR9XCIgdG8gYmUgcGVyc2lzdGVkYFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2V0VGltZW91dChjaGVjaywgMTAwMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KSgpO1xuICB9KTtcbn07XG4iLCJjb25zdCBpbnZhcmlhbnQgPSByZXF1aXJlKFwiaW52YXJpYW50XCIpO1xuY29uc3QgZmV0Y2ggPSByZXF1aXJlKFwibm9kZS1mZXRjaFwiKTtcblxuY29uc3QgQ1JZU1RBTExJWkVfVEVOQU5UX0lERU5USUZJRVIgPSBwcm9jZXNzLmVudi5DUllTVEFMTElaRV9URU5BTlRfSURFTlRJRklFUjtcbmNvbnN0IENSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9JRCA9IHByb2Nlc3MuZW52LkNSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9JRDtcbmNvbnN0IENSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9TRUNSRVQgPVxuICBwcm9jZXNzLmVudi5DUllTVEFMTElaRV9BQ0NFU1NfVE9LRU5fU0VDUkVUO1xuXG5pbnZhcmlhbnQoXG4gIENSWVNUQUxMSVpFX1RFTkFOVF9JREVOVElGSUVSLFxuICBcIk1pc3NpbmcgcHJvY2Vzcy5lbnYuQ1JZU1RBTExJWkVfVEVOQU5UX0lERU5USUZJRVJcIlxuKTtcblxuZnVuY3Rpb24gY3JlYXRlQXBpQ2FsbGVyKHVyaSkge1xuICByZXR1cm4gYXN5bmMgZnVuY3Rpb24gY2FsbEFwaSh7IHF1ZXJ5LCB2YXJpYWJsZXMsIG9wZXJhdGlvbk5hbWUgfSkge1xuICAgIGludmFyaWFudChcbiAgICAgIENSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9JRCxcbiAgICAgIFwiTWlzc2luZyBwcm9jZXNzLmVudi5DUllTVEFMTElaRV9BQ0NFU1NfVE9LRU5fSURcIlxuICAgICk7XG4gICAgaW52YXJpYW50KFxuICAgICAgQ1JZU1RBTExJWkVfQUNDRVNTX1RPS0VOX1NFQ1JFVCxcbiAgICAgIFwiTWlzc2luZyBwcm9jZXNzLmVudi5DUllTVEFMTElaRV9BQ0NFU1NfVE9LRU5fU0VDUkVUXCJcbiAgICApO1xuXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaCh1cmksIHtcbiAgICAgIG1ldGhvZDogXCJQT1NUXCIsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiY29udGVudC10eXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICBcIlgtQ3J5c3RhbGxpemUtQWNjZXNzLVRva2VuLUlkXCI6IENSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9JRCxcbiAgICAgICAgXCJYLUNyeXN0YWxsaXplLUFjY2Vzcy1Ub2tlbi1TZWNyZXRcIjogQ1JZU1RBTExJWkVfQUNDRVNTX1RPS0VOX1NFQ1JFVCxcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG9wZXJhdGlvbk5hbWUsIHF1ZXJ5LCB2YXJpYWJsZXMgfSksXG4gICAgfSk7XG5cbiAgICBjb25zdCBqc29uID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuXG4gICAgaWYgKGpzb24uZXJyb3JzKSB7XG4gICAgICBjb25zb2xlLmxvZyhKU09OLnN0cmluZ2lmeShqc29uLmVycm9ycywgbnVsbCwgMikpO1xuICAgIH1cblxuICAgIHJldHVybiBqc29uO1xuICB9O1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tdW51c2VkLXZhcnNcbmZ1bmN0aW9uIG5vcm1hbGlzZU9yZGVyTW9kZWwoeyBjdXN0b21lciwgY2FydCwgdG90YWwsIHZvdWNoZXIsIC4uLnJlc3QgfSkge1xuICByZXR1cm4ge1xuICAgIC4uLnJlc3QsXG4gICAgLi4uKHRvdGFsICYmIHtcbiAgICAgIHRvdGFsOiB7XG4gICAgICAgIGdyb3NzOiB0b3RhbC5ncm9zcyxcbiAgICAgICAgbmV0OiB0b3RhbC5uZXQsXG4gICAgICAgIGN1cnJlbmN5OiB0b3RhbC5jdXJyZW5jeSxcbiAgICAgICAgdGF4OiB0b3RhbC50YXgsXG4gICAgICB9LFxuICAgIH0pLFxuICAgIC4uLihjYXJ0ICYmIHtcbiAgICAgIGNhcnQ6IGNhcnQubWFwKGZ1bmN0aW9uIGhhbmRsZU9yZGVyQ2FydEl0ZW0oaXRlbSkge1xuICAgICAgICBjb25zdCB7XG4gICAgICAgICAgaW1hZ2VzID0gW10sXG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBza3UsXG4gICAgICAgICAgcHJvZHVjdElkLFxuICAgICAgICAgIHByb2R1Y3RWYXJpYW50SWQsXG4gICAgICAgICAgcXVhbnRpdHksXG4gICAgICAgICAgcHJpY2UsXG4gICAgICAgIH0gPSBpdGVtO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBza3UsXG4gICAgICAgICAgcHJvZHVjdElkLFxuICAgICAgICAgIHByb2R1Y3RWYXJpYW50SWQsXG4gICAgICAgICAgcXVhbnRpdHksXG4gICAgICAgICAgcHJpY2UsXG4gICAgICAgICAgaW1hZ2VVcmw6IGltYWdlcyAmJiBpbWFnZXNbMF0gJiYgaW1hZ2VzWzBdLnVybCxcbiAgICAgICAgfTtcbiAgICAgIH0pLFxuICAgIH0pLFxuICAgIC4uLihjdXN0b21lciAmJiB7XG4gICAgICBjdXN0b21lcjoge1xuICAgICAgICBpZGVudGlmaWVyOiBjdXN0b21lci5pZGVudGlmaWVyLFxuICAgICAgICBmaXJzdE5hbWU6IGN1c3RvbWVyLmZpcnN0TmFtZSB8fCBudWxsLFxuICAgICAgICBsYXN0TmFtZTogY3VzdG9tZXIubGFzdE5hbWUgfHwgbnVsbCxcbiAgICAgICAgYWRkcmVzc2VzOiBjdXN0b21lci5hZGRyZXNzZXMgfHwgW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHR5cGU6IFwiYmlsbGluZ1wiLFxuICAgICAgICAgICAgZW1haWw6IGN1c3RvbWVyLmVtYWlsIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICB9KSxcbiAgfTtcbn1cblxuY29uc3QgZ2V0VGVuYW50SWQgPSAoZnVuY3Rpb24gKCkge1xuICBsZXQgdGVuYW50SWQ7XG5cbiAgcmV0dXJuIGFzeW5jICgpID0+IHtcbiAgICBpZiAodGVuYW50SWQpIHtcbiAgICAgIHJldHVybiB0ZW5hbnRJZDtcbiAgICB9XG5cbiAgICBjb25zdCB0ZW5hbnRJZFJlc3BvbnNlID0gYXdhaXQgY2FsbENhdGFsb2d1ZUFwaSh7XG4gICAgICBxdWVyeTogYFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHRlbmFudCB7XG4gICAgICAgICAgICAgIGlkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICBgLFxuICAgIH0pO1xuICAgIHRlbmFudElkID0gdGVuYW50SWRSZXNwb25zZS5kYXRhLnRlbmFudC5pZDtcblxuICAgIHJldHVybiB0ZW5hbnRJZDtcbiAgfTtcbn0pKCk7XG5cbi8qKlxuICogQ2F0YWxvZ3VlIEFQSSBpcyB0aGUgZmFzdCByZWFkLW9ubHkgQVBJIHRvIGxvb2t1cCBkYXRhXG4gKiBmb3IgYSBnaXZlbiBpdGVtIHBhdGggb3IgYW55dGhpbmcgZWxzZSBpbiB0aGUgY2F0YWxvZ3VlXG4gKi9cbmNvbnN0IGNhbGxDYXRhbG9ndWVBcGkgPSBjcmVhdGVBcGlDYWxsZXIoXG4gIGBodHRwczovL2FwaS5jcnlzdGFsbGl6ZS5jb20vJHtDUllTVEFMTElaRV9URU5BTlRfSURFTlRJRklFUn0vY2F0YWxvZ3VlYFxuKTtcblxuLyoqXG4gKiBTZWFyY2ggQVBJIGlzIHRoZSBmYXN0IHJlYWQtb25seSBBUEkgdG8gc2VhcmNoIGFjcm9zc1xuICogYWxsIGl0ZW1zIGFuZCB0b3BpY3NcbiAqL1xuY29uc3QgY2FsbFNlYXJjaEFwaSA9IGNyZWF0ZUFwaUNhbGxlcihcbiAgYGh0dHBzOi8vYXBpLmNyeXN0YWxsaXplLmNvbS8ke0NSWVNUQUxMSVpFX1RFTkFOVF9JREVOVElGSUVSfS9zZWFyY2hgXG4pO1xuXG4vKipcbiAqIE9yZGVycyBBUEkgaXMgdGhlIGhpZ2hseSBzY2FsYWJsZSBBUEkgdG8gc2VuZC9yZWFkIG1hc3NpdmVcbiAqIGFtb3VudHMgb2Ygb3JkZXJzXG4gKi9cbmNvbnN0IGNhbGxPcmRlcnNBcGkgPSBjcmVhdGVBcGlDYWxsZXIoXG4gIGBodHRwczovL2FwaS5jcnlzdGFsbGl6ZS5jb20vJHtDUllTVEFMTElaRV9URU5BTlRfSURFTlRJRklFUn0vb3JkZXJzYFxuKTtcblxuLyoqXG4gKiBUaGUgUElNIEFQSSBpcyB1c2VkIGZvciBkb2luZyB0aGUgQUxMIHBvc3NpYmxlIGFjdGlvbnMgb25cbiAqIGEgdGVuYW50IG9yIHlvdXIgdXNlciBwcm9maWxlXG4gKi9cbmNvbnN0IGNhbGxQaW1BcGkgPSBjcmVhdGVBcGlDYWxsZXIoXCJodHRwczovL3BpbS5jcnlzdGFsbGl6ZS5jb20vZ3JhcGhxbFwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5vcm1hbGlzZU9yZGVyTW9kZWwsXG4gIGNhbGxDYXRhbG9ndWVBcGksXG4gIGNhbGxTZWFyY2hBcGksXG4gIGNhbGxPcmRlcnNBcGksXG4gIGNhbGxQaW1BcGksXG4gIGdldFRlbmFudElkLFxufTtcbiIsImNvbnN0IHsgc2VuZEVtYWlsIH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcblxuY29uc3Qgc2VuZE9yZGVyQ29uZmlybWF0aW9uID0gcmVxdWlyZShcIi4vb3JkZXItY29uZmlybWF0aW9uXCIpO1xuY29uc3Qgc2VuZFVzZXJNYWdpY0xpbmsgPSByZXF1aXJlKFwiLi91c2VyLW1hZ2ljLWxpbmtcIik7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBzZW5kRW1haWwsXG4gIHNlbmRPcmRlckNvbmZpcm1hdGlvbixcbiAgc2VuZFVzZXJNYWdpY0xpbmssXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBzZW5kT3JkZXJDb25maXJtYXRpb24ob3JkZXJJZCkge1xuICB0cnkge1xuICAgIGNvbnN0IG1qbWwyaHRtbCA9IHJlcXVpcmUoXCJtam1sXCIpO1xuXG4gICAgY29uc3QgeyBmb3JtYXRDdXJyZW5jeSB9ID0gcmVxdWlyZShcIi4uLy4uL2xpYi9jdXJyZW5jeVwiKTtcbiAgICBjb25zdCB7IG9yZGVycyB9ID0gcmVxdWlyZShcIi4uL2NyeXN0YWxsaXplXCIpO1xuICAgIGNvbnN0IHsgc2VuZEVtYWlsIH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcblxuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgb3JkZXJzLmdldChvcmRlcklkKTtcblxuICAgIGNvbnN0IHsgZW1haWwgfSA9IG9yZGVyLmN1c3RvbWVyLmFkZHJlc3Nlc1swXTtcblxuICAgIGlmICghZW1haWwpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgICBlcnJvcjogXCJObyBlbWFpbCBmb3VuZCBmb3IgdGhlIGN1c3RvbWVyXCIsXG4gICAgICB9O1xuICAgIH1cblxuICAgIGNvbnN0IHsgaHRtbCB9ID0gbWptbDJodG1sKGBcbiAgICAgIDxtam1sPlxuICAgICAgICA8bWotYm9keT5cbiAgICAgICAgPG1qLXNlY3Rpb24+XG4gICAgICAgICAgPG1qLWNvbHVtbj5cbiAgICAgICAgICAgIDxtai10ZXh0PlxuICAgICAgICAgICAgICA8aDE+T3JkZXIgU3VtbWFyeTwvaDE+XG4gICAgICAgICAgICAgIDxwPlRoYW5rcyBmb3IgeW91ciBvcmRlciEgVGhpcyBlbWFpbCBjb250YWlucyBhIGNvcHkgb2YgeW91ciBvcmRlciBmb3IgeW91ciByZWZlcmVuY2UuPC9wPlxuICAgICAgICAgICAgICA8cD5cbiAgICAgICAgICAgICAgICBPcmRlciBOdW1iZXI6IDxzdHJvbmc+IyR7b3JkZXIuaWR9PC9zdHJvbmc+XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgRmlyc3QgbmFtZTogPHN0cm9uZz4ke29yZGVyLmN1c3RvbWVyLmZpcnN0TmFtZX08L3N0cm9uZz48YnIgLz5cbiAgICAgICAgICAgICAgICBMYXN0IG5hbWU6IDxzdHJvbmc+JHtvcmRlci5jdXN0b21lci5sYXN0TmFtZX08L3N0cm9uZz48YnIgLz5cbiAgICAgICAgICAgICAgICBFbWFpbCBhZGRyZXNzOiA8c3Ryb25nPiR7ZW1haWx9PC9zdHJvbmc+XG4gICAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgICAgPHA+XG4gICAgICAgICAgICAgICAgVG90YWw6IDxzdHJvbmc+JHtmb3JtYXRDdXJyZW5jeSh7XG4gICAgICAgICAgICAgICAgICBhbW91bnQ6IG9yZGVyLnRvdGFsLmdyb3NzLFxuICAgICAgICAgICAgICAgICAgY3VycmVuY3k6IG9yZGVyLnRvdGFsLmN1cnJlbmN5LFxuICAgICAgICAgICAgICAgIH0pfTwvc3Ryb25nPlxuICAgICAgICAgICAgICA8L3A+XG4gICAgICAgICAgICA8L21qLXRleHQ+XG4gICAgICAgICAgICA8bWotdGFibGU+XG4gICAgICAgICAgICAgIDx0ciBzdHlsZT1cImJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZWNlZGVlOyB0ZXh0LWFsaWduOiBsZWZ0O1wiPlxuICAgICAgICAgICAgICAgIDx0aCBzdHlsZT1cInBhZGRpbmc6IDAgMTVweCAwIDA7XCI+TmFtZTwvdGg+XG4gICAgICAgICAgICAgICAgPHRoIHN0eWxlPVwicGFkZGluZzogMCAxNXB4O1wiPlF1YW50aXR5PC90aD5cbiAgICAgICAgICAgICAgICA8dGggc3R5bGU9XCJwYWRkaW5nOiAwIDAgMCAxNXB4O1wiPlRvdGFsPC90aD5cbiAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgJHtvcmRlci5jYXJ0Lm1hcChcbiAgICAgICAgICAgICAgICAoaXRlbSkgPT4gYDx0cj5cbiAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDAgMTVweCAwIDA7XCI+JHtpdGVtLm5hbWV9ICgke1xuICAgICAgICAgICAgICAgICAgaXRlbS5za3VcbiAgICAgICAgICAgICAgICB9KTwvdGQ+XG4gICAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiAwIDE1cHg7XCI+JHtpdGVtLnF1YW50aXR5fTwvdGQ+XG4gICAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiAwIDAgMCAxNXB4O1wiPiR7Zm9ybWF0Q3VycmVuY3koe1xuICAgICAgICAgICAgICAgICAgICBhbW91bnQ6IGl0ZW0ucHJpY2UuZ3Jvc3MgKiBpdGVtLnF1YW50aXR5LFxuICAgICAgICAgICAgICAgICAgICBjdXJyZW5jeTogaXRlbS5wcmljZS5jdXJyZW5jeSxcbiAgICAgICAgICAgICAgICAgIH0pfTwvdGQ+XG4gICAgICAgICAgICAgICAgPC90cj5gXG4gICAgICAgICAgICAgICl9XG4gICAgICAgICAgICA8L21qLXRhYmxlPlxuICAgICAgICAgIDwvbWotY29sdW1uPlxuICAgICAgICA8L21qLXNlY3Rpb24+XG4gICAgICAgIDwvbWotYm9keT5cbiAgICAgIDwvbWptbD5cbiAgICBgKTtcblxuICAgIGF3YWl0IHNlbmRFbWFpbCh7XG4gICAgICB0bzogZW1haWwsXG4gICAgICBzdWJqZWN0OiBcIk9yZGVyIHN1bW1hcnlcIixcbiAgICAgIGh0bWwsXG4gICAgfSk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogZmFsc2UsXG4gICAgICBlcnJvcixcbiAgICB9O1xuICB9XG59O1xuIiwiY29uc3QgeyBzZW5kRW1haWwgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIHNlbmRNYWdpY0xpbmtMb2dpbih7IGxvZ2luTGluaywgZW1haWwgfSkge1xuICB0cnkge1xuICAgIGNvbnN0IG1qbWwyaHRtbCA9IHJlcXVpcmUoXCJtam1sXCIpO1xuICAgIGNvbnN0IHsgaHRtbCB9ID0gbWptbDJodG1sKGBcbiAgICAgIDxtam1sPlxuICAgICAgICA8bWotYm9keT5cbiAgICAgICAgICA8bWotc2VjdGlvbj5cbiAgICAgICAgICAgIDxtai1jb2x1bW4+XG4gICAgICAgICAgICAgIDxtai10ZXh0PkhpIHRoZXJlISBTaW1wbHkgZm9sbG93IHRoZSBsaW5rIGJlbG93IHRvIGxvZ2luLjwvbWotdGV4dD5cbiAgICAgICAgICAgICAgPG1qLWJ1dHRvbiBocmVmPVwiJHtsb2dpbkxpbmt9XCIgYWxpZ249XCJsZWZ0XCI+Q2xpY2sgaGVyZSB0byBsb2dpbjwvbWotYnV0dG9uPlxuICAgICAgICAgICAgPC9tai1jb2x1bW4+XG4gICAgICAgICAgPC9tai1zZWN0aW9uPlxuICAgICAgICA8L21qLWJvZHk+XG4gICAgICA8L21qbWw+XG4gICAgYCk7XG5cbiAgICBhd2FpdCBzZW5kRW1haWwoe1xuICAgICAgdG86IGVtYWlsLFxuICAgICAgc3ViamVjdDogXCJNYWdpYyBsaW5rIGxvZ2luXCIsXG4gICAgICBodG1sLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgfTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgcmV0dXJuIHtcbiAgICAgIHN1Y2Nlc3M6IGZhbHNlLFxuICAgICAgZXJyb3IsXG4gICAgfTtcbiAgfVxufTtcbiIsImNvbnN0IGludmFyaWFudCA9IHJlcXVpcmUoXCJpbnZhcmlhbnRcIik7XG5cbmNvbnN0IFNFTkRHUklEX0FQSV9LRVkgPSBwcm9jZXNzLmVudi5TRU5ER1JJRF9BUElfS0VZO1xuY29uc3QgRU1BSUxfRlJPTSA9IHByb2Nlc3MuZW52LkVNQUlMX0ZST007XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBzZW5kRW1haWwoYXJncykge1xuICAgIGludmFyaWFudChTRU5ER1JJRF9BUElfS0VZLCBcInByb2Nlc3MuZW52LlNFTkRHUklEX0FQSV9LRVkgbm90IGRlZmluZWRcIik7XG4gICAgaW52YXJpYW50KEVNQUlMX0ZST00sIFwicHJvY2Vzcy5lbnYuRU1BSUxfRlJPTSBpcyBub3QgZGVmaW5lZFwiKTtcblxuICAgIGNvbnN0IHNnTWFpbCA9IHJlcXVpcmUoXCJAc2VuZGdyaWQvbWFpbFwiKTtcbiAgICBzZ01haWwuc2V0QXBpS2V5KFNFTkRHUklEX0FQSV9LRVkpO1xuXG4gICAgcmV0dXJuIHNnTWFpbC5zZW5kKHtcbiAgICAgIGZyb206IEVNQUlMX0ZST00sXG4gICAgICAuLi5hcmdzLFxuICAgIH0pO1xuICB9LFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gY3JlYXRlQ3J5c3RhbGxpemVPcmRlcih7XG4gIGNoZWNrb3V0TW9kZWwsXG4gIGNvbnRleHQsXG59KSB7XG4gIGNvbnN0IGJhc2tldFNlcnZpY2UgPSByZXF1aXJlKFwiLi4vLi4vYmFza2V0LXNlcnZpY2VcIik7XG4gIGNvbnN0IGNyeXN0YWxsaXplID0gcmVxdWlyZShcIi4uLy4uL2NyeXN0YWxsaXplXCIpO1xuXG4gIGNvbnN0IHsgYmFza2V0TW9kZWwsIGN1c3RvbWVyIH0gPSBjaGVja291dE1vZGVsO1xuICBjb25zdCB7IHVzZXIgfSA9IGNvbnRleHQ7XG5cbiAgLy8gQWRkIHRoZSBpZGVudGlmaWVyIGZyb20gdGhlIGN1cnJlbnQgbG9nZ2VkIGluIHVzZXJcbiAgY29uc3QgY3VzdG9tZXJXaXRoQ3VycmVudExvZ2dlZEluVXNlciA9IHtcbiAgICAuLi5jdXN0b21lcixcbiAgfTtcbiAgaWYgKHVzZXIpIHtcbiAgICBjdXN0b21lcldpdGhDdXJyZW50TG9nZ2VkSW5Vc2VyLmlkZW50aWZpZXIgPSB1c2VyLmVtYWlsO1xuICB9XG5cbiAgY29uc3QgYmFza2V0ID0gYXdhaXQgYmFza2V0U2VydmljZS5nZXQoeyBiYXNrZXRNb2RlbCwgY29udGV4dCB9KTtcblxuICAvKlxuICAgKiBVc2UgYSBDcnlzdGFsbGl6ZSBvcmRlciBhbmQgdGhlIGZ1bGZpbG1lbnQgcGlwZWxpbmVzIHRvXG4gICAqIG1hbmFnZSB0aGUgbGlmZWN5Y2xlIG9mIHRoZSBvcmRlclxuICAgKi9cbiAgY29uc3QgY3J5c3RhbGxpemVPcmRlciA9IGF3YWl0IGNyeXN0YWxsaXplLm9yZGVycy5jcmVhdGUoe1xuICAgIC4uLmJhc2tldCxcbiAgICBjdXN0b21lcjogY3VzdG9tZXJXaXRoQ3VycmVudExvZ2dlZEluVXNlcixcbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiB0cnVlLFxuICAgIG9yZGVySWQ6IGNyeXN0YWxsaXplT3JkZXIuaWQsXG4gIH07XG59O1xuIiwiLyoqXG4gKiBNYW51YWwgaW52b2ljZSBcInBheW1lbnQgcHJvdmlkZXJcIlxuICpcbiAqIEFsbCB0aGF0IHRoaXMgZG9lcyBpcyB0byBhbGxvdyBhbiB1bnBhaWQgY2FydFxuICogdG8gYmUgc3RvcmVkIGluIENyeXN0YWxsaXplXG4gKi9cblxuY29uc3QgY3JlYXRlQ3J5c3RhbGxpemVPcmRlciA9IHJlcXVpcmUoXCIuL2NyZWF0ZS1jcnlzdGFsbGl6ZS1vcmRlclwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGVuYWJsZWQ6IHRydWUsXG4gIGZyb250ZW5kQ29uZmlnOiB7fSxcbiAgY3JlYXRlQ3J5c3RhbGxpemVPcmRlcixcbn07XG4iLCIvKipcbiAqIEFuIGV4YW1wbGUgb2YgaG93IHRvIGNhcHR1cmUgYW4gYW1vdW50IGZvciBvbiBhblxuICogb3JkZXIuIFlvdSB3b3VsZCB0eXBpY2FsbHkgZG8gdGhpcyBhcyBhIHJlc3BvbnNlIHRvXG4gKiBhbiB1cGRhdGUgb2YgYSBGdWxmaWxtZW50IFBpcGVsYW5lIFN0YWdlIGNoYW5nZSBpblxuICogQ3J5c3RhbGxpemUgKGh0dHBzOi8vY3J5c3RhbGxpemUuY29tL2xlYXJuL2RldmVsb3Blci1ndWlkZXMvb3JkZXItYXBpL2Z1bGZpbG1lbnQtcGlwZWxpbmVzKVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24ga2xhcm5hQ2FwdHVyZSh7IGNyeXN0YWxsaXplT3JkZXJJZCB9KSB7XG4gIGNvbnN0IGNyeXN0YWxsaXplID0gcmVxdWlyZShcIi4uLy4uL2NyeXN0YWxsaXplXCIpO1xuICBjb25zdCB7IGdldENsaWVudCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5cbiAgLy8gUmV0cmlldmUgdGhlIENyeXN0YWxsaXplIG9yZGVyXG4gIGNvbnN0IGNyeXN0YWxsaXplT3JkZXIgPSBhd2FpdCBjcnlzdGFsbGl6ZS5vcmRlcnMuZ2V0KGNyeXN0YWxsaXplT3JkZXJJZCk7XG4gIGNvbnN0IGtsYXJuYVBheW1lbnQgPSBjcnlzdGFsbGl6ZU9yZGVyLnBheW1lbnQuZmluZChcbiAgICAocCkgPT4gcC5wcm92aWRlciA9PT0gXCJrbGFybmFcIlxuICApO1xuICBpZiAoIWtsYXJuYVBheW1lbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE9yZGVyICR7Y3J5c3RhbGxpemVPcmRlcklkfSBoYXMgbm8gS2xhcm5hIHBheW1lbnRgKTtcbiAgfVxuICBjb25zdCBrbGFybmFPcmRlcklkID0ga2xhcm5hUGF5bWVudC5vcmRlcklkO1xuICBpZiAoIWtsYXJuYU9yZGVySWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE9yZGVyICR7Y3J5c3RhbGxpemVPcmRlcklkfSBoYXMgbm8ga2xhcm5hT3JkZXJJZGApO1xuICB9XG5cbiAgY29uc3Qga2xhcm5hQ2xpZW50ID0gYXdhaXQgZ2V0Q2xpZW50KCk7XG5cbiAgLy8gQ2FwdHVyZSB0aGUgZnVsbCBhbW91bnQgZm9yIHRoZSBvcmRlclxuICBjb25zdCB7XG4gICAgZXJyb3IsXG4gICAgcmVzcG9uc2UsXG4gIH0gPSBhd2FpdCBrbGFybmFDbGllbnQub3JkZXJtYW5hZ2VtZW50VjEuY2FwdHVyZXMuY2FwdHVyZShrbGFybmFPcmRlcklkKTtcblxuICBjb25zb2xlLmxvZyhlcnJvciwgcmVzcG9uc2UpO1xuXG4gIC8qKlxuICAgKiBZb3Ugd291bGQgdHlwaWNhbGx5IGFsc28gbW92ZSB0aGUgb3JkZXIgaW4gdGhlXG4gICAqIGZ1bGZpbG1lbnQgcGlwZWxpbmUgZnJvbSBhIHN0YWdlIGNhbGxlZCBlLmcuXG4gICAqIFwiY3JlYXRlZFwiIHRvIFwicHVyY2hhc2VkXCIgaGVyZVxuICAgKi9cbn07XG4iLCJjb25zdCBLTEFSTkFfVVNFUk5BTUUgPSBwcm9jZXNzLmVudi5LTEFSTkFfVVNFUk5BTUU7XG5jb25zdCBLTEFSTkFfUEFTU1dPUkQgPSBwcm9jZXNzLmVudi5LTEFSTkFfUEFTU1dPUkQ7XG5cbmNvbnN0IHsgZ2V0Q2xpZW50IH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcblxuY29uc3QgcmVuZGVyQ2hlY2tvdXQgPSByZXF1aXJlKFwiLi9yZW5kZXItY2hlY2tvdXRcIik7XG5jb25zdCBwdXNoID0gcmVxdWlyZShcIi4vcHVzaFwiKTtcbmNvbnN0IGNhcHR1cmUgPSByZXF1aXJlKFwiLi9jYXB0dXJlXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZW5hYmxlZDogQm9vbGVhbihLTEFSTkFfVVNFUk5BTUUgJiYgS0xBUk5BX1BBU1NXT1JEKSxcbiAgZnJvbnRlbmRDb25maWc6IHt9LFxuICBnZXRDbGllbnQsXG4gIHJlbmRlckNoZWNrb3V0LFxuICBwdXNoLFxuICBjYXB0dXJlLFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24ga2xhcm5hUHVzaCh7XG4gIGNyeXN0YWxsaXplT3JkZXJJZCxcbiAga2xhcm5hT3JkZXJJZCxcbn0pIHtcbiAgY29uc3QgeyBnZXRDbGllbnQgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuICBjb25zb2xlLmxvZyhcIktsYXJuYSBwdXNoXCIsIHsgY3J5c3RhbGxpemVPcmRlcklkLCBrbGFybmFPcmRlcklkIH0pO1xuXG4gIGNvbnN0IGtsYXJuYUNsaWVudCA9IGF3YWl0IGdldENsaWVudCgpO1xuXG4gIC8vIFJldHJpZXZlIHRoZSBLbGFybmEgb3JkZXIgdG8gZ2V0IHRoZSBwYXltZW50IHN0YXR1c1xuXG4gIC8vIEFja25vd2xlZGdlIHRoZSBLbGFybmEgb3JkZXJcbiAgYXdhaXQga2xhcm5hQ2xpZW50Lm9yZGVybWFuYWdlbWVudFYxLm9yZGVycy5hY2tub3dsZWRnZShrbGFybmFPcmRlcklkKTtcblxuICAvKipcbiAgICogWW91IHdvdWxkIHR5cGljYWxseSBhbHNvIG1vdmUgdGhlIG9yZGVyIGluIHRoZVxuICAgKiBmdWxmaWxtZW50IHBpcGVsaW5lIGZyb20gYSBzdGFnZSBjYWxsZWQgZS5nLlxuICAgKiBcImluaXRpYWxcIiB0byBcImNyZWF0ZWRcIiBoZXJlXG4gICAqL1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gcmVuZGVyQ2hlY2tvdXQoeyBjaGVja291dE1vZGVsLCBjb250ZXh0IH0pIHtcbiAgY29uc3QgY3J5c3RhbGxpemUgPSByZXF1aXJlKFwiLi4vLi4vY3J5c3RhbGxpemVcIik7XG4gIGNvbnN0IGJhc2tldFNlcnZpY2UgPSByZXF1aXJlKFwiLi4vLi4vYmFza2V0LXNlcnZpY2VcIik7XG5cbiAgY29uc3QgeyBnZXRDbGllbnQgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuICBjb25zdCB0b0tsYXJuYU9yZGVyTW9kZWwgPSByZXF1aXJlKFwiLi90by1rbGFybmEtb3JkZXItbW9kZWxcIik7XG5cbiAgY29uc3Qge1xuICAgIGJhc2tldE1vZGVsLFxuICAgIGN1c3RvbWVyLFxuICAgIGNvbmZpcm1hdGlvblVSTCxcbiAgICB0ZXJtc1VSTCxcbiAgICBjaGVja291dFVSTCxcbiAgfSA9IGNoZWNrb3V0TW9kZWw7XG4gIGNvbnN0IHsgc2VydmljZUNhbGxiYWNrSG9zdCwgdXNlciB9ID0gY29udGV4dDtcblxuICBsZXQgeyBjcnlzdGFsbGl6ZU9yZGVySWQsIGtsYXJuYU9yZGVySWQgfSA9IGJhc2tldE1vZGVsO1xuXG4gIGNvbnN0IGJhc2tldCA9IGF3YWl0IGJhc2tldFNlcnZpY2UuZ2V0KHsgYmFza2V0TW9kZWwsIGNvbnRleHQgfSk7XG5cbiAgLy8gQWRkIHRoZSBpZGVudGlmaWVyIGZyb20gdGhlIGN1cnJlbnQgbG9nZ2VkIGluIHVzZXJcbiAgY29uc3QgY3VzdG9tZXJXaXRoQ3VycmVudExvZ2dlZEluVXNlciA9IHtcbiAgICAuLi5jdXN0b21lcixcbiAgfTtcbiAgaWYgKHVzZXIpIHtcbiAgICBjdXN0b21lcldpdGhDdXJyZW50TG9nZ2VkSW5Vc2VyLmlkZW50aWZpZXIgPSB1c2VyLmVtYWlsO1xuICB9XG5cbiAgLyoqXG4gICAqIFVzZSBhIENyeXN0YWxsaXplIG9yZGVyIGFuZCB0aGUgZnVsZmlsbWVudCBwaXBlbGluZXMgdG9cbiAgICogbWFuYWdlIHRoZSBsaWZlY3ljbGUgb2YgdGhlIG9yZGVyXG4gICAqL1xuICBpZiAoY3J5c3RhbGxpemVPcmRlcklkKSB7XG4gICAgYXdhaXQgY3J5c3RhbGxpemUub3JkZXJzLnVwZGF0ZShjcnlzdGFsbGl6ZU9yZGVySWQsIHtcbiAgICAgIC4uLmJhc2tldCxcbiAgICAgIGN1c3RvbWVyOiBjdXN0b21lcldpdGhDdXJyZW50TG9nZ2VkSW5Vc2VyLFxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGNyeXN0YWxsaXplT3JkZXIgPSBhd2FpdCBjcnlzdGFsbGl6ZS5vcmRlcnMuY3JlYXRlKHtcbiAgICAgIC4uLmJhc2tldCxcbiAgICAgIGN1c3RvbWVyOiBjdXN0b21lcldpdGhDdXJyZW50TG9nZ2VkSW5Vc2VyLFxuICAgIH0pO1xuICAgIGNyeXN0YWxsaXplT3JkZXJJZCA9IGNyeXN0YWxsaXplT3JkZXIuaWQ7XG4gIH1cblxuICAvLyBTZXR1cCB0aGUgY29uZmlybWF0aW9uIFVSTFxuICBjb25zdCBjb25maXJtYXRpb24gPSBuZXcgVVJMKFxuICAgIGNvbmZpcm1hdGlvblVSTC5yZXBsYWNlKFwie2NyeXN0YWxsaXplT3JkZXJJZH1cIiwgY3J5c3RhbGxpemVPcmRlcklkKVxuICApO1xuICBjb25maXJtYXRpb24uc2VhcmNoUGFyYW1zLmFwcGVuZChcImtsYXJuYU9yZGVySWRcIiwgXCJ7Y2hlY2tvdXQub3JkZXIuaWR9XCIpO1xuXG4gIGNvbnN0IHZhbGlkS2xhcm5hT3JkZXJNb2RlbCA9IHtcbiAgICAuLi50b0tsYXJuYU9yZGVyTW9kZWwoYmFza2V0KSxcbiAgICBwdXJjaGFzZV9jb3VudHJ5OiBcIk5PXCIsXG4gICAgcHVyY2hhc2VfY3VycmVuY3k6IGJhc2tldC50b3RhbC5jdXJyZW5jeSB8fCBcIk5PS1wiLFxuICAgIGxvY2FsZTogXCJuby1uYlwiLFxuICAgIG1lcmNoYW50X3VybHM6IHtcbiAgICAgIHRlcm1zOiB0ZXJtc1VSTCxcbiAgICAgIGNoZWNrb3V0OiBjaGVja291dFVSTCxcbiAgICAgIGNvbmZpcm1hdGlvbjogY29uZmlybWF0aW9uLnRvU3RyaW5nKCksXG4gICAgICBwdXNoOiBgJHtzZXJ2aWNlQ2FsbGJhY2tIb3N0fS93ZWJob29rcy9wYXltZW50LXByb3ZpZGVycy9rbGFybmEvcHVzaD9jcnlzdGFsbGl6ZU9yZGVySWQ9JHtjcnlzdGFsbGl6ZU9yZGVySWR9JmtsYXJuYU9yZGVySWQ9e2NoZWNrb3V0Lm9yZGVyLmlkfWAsXG4gICAgfSxcbiAgfTtcblxuICBjb25zdCBrbGFybmFDbGllbnQgPSBhd2FpdCBnZXRDbGllbnQoKTtcblxuICAvKipcbiAgICogSG9sZCB0aGUgSFRNTCBzbmlwcGV0IHRoYXQgd2lsbCBiZSB1c2VkIG9uIHRoZVxuICAgKiBmcm9udGVuZCB0byBkaXNwbGF5IHRoZSBLbGFybmEgY2hlY2tvdXRcbiAgICovXG4gIGxldCBodG1sID0gXCJcIjtcblxuICAvKipcbiAgICogVGhlcmUgaXMgYWxyZWFkeSBhIEtsYXJuYSBvcmRlciBpZCBmb3IgdGhpcyB1c2VyXG4gICAqIHNlc3Npb24sIGxldCdzIHVzZSB0aGF0IGFuZCBub3QgY3JlYXRlIGEgbmV3IG9uZVxuICAgKi9cbiAgaWYgKGtsYXJuYU9yZGVySWQpIHtcbiAgICBjb25zdCB7IGVycm9yLCByZXNwb25zZSB9ID0gYXdhaXQga2xhcm5hQ2xpZW50LmNoZWNrb3V0VjMudXBkYXRlT3JkZXIoXG4gICAgICBrbGFybmFPcmRlcklkLFxuICAgICAgdmFsaWRLbGFybmFPcmRlck1vZGVsXG4gICAgKTtcblxuICAgIGlmICghZXJyb3IpIHtcbiAgICAgIGh0bWwgPSByZXNwb25zZS5odG1sX3NuaXBwZXQ7XG4gICAgICBrbGFybmFPcmRlcklkID0gcmVzcG9uc2Uub3JkZXJfaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHsgZXJyb3IsIHJlc3BvbnNlIH0gPSBhd2FpdCBrbGFybmFDbGllbnQuY2hlY2tvdXRWMy5jcmVhdGVPcmRlcihcbiAgICAgIHZhbGlkS2xhcm5hT3JkZXJNb2RlbFxuICAgICk7XG5cbiAgICBpZiAoIWVycm9yKSB7XG4gICAgICBodG1sID0gcmVzcG9uc2UuaHRtbF9zbmlwcGV0O1xuICAgICAga2xhcm5hT3JkZXJJZCA9IHJlc3BvbnNlLm9yZGVyX2lkO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyb3IpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgQ3J5c3RhbGxpemUgb3JkZXIgY3JlYXRpbmcgaXMgYXN5bmNocm9ub3VzLCBzbyB3ZSBoYXZlXG4gICAqIHRvIHdhaXQgZm9yIHRoZSBvcmRlciB0byBiZSBmdWxseSBwZXJzaXN0ZWRcbiAgICovXG4gIGF3YWl0IGNyeXN0YWxsaXplLm9yZGVycy53YWl0Rm9yT3JkZXJUb0JlUGVyc2lzdGF0ZWQoe1xuICAgIGlkOiBjcnlzdGFsbGl6ZU9yZGVySWQsXG4gIH0pO1xuXG4gIC8vIFRhZyB0aGUgQ3J5c3RhbGxpemUgb3JkZXIgd2l0aCB0aGUgS2xhcm5hIG9yZGVyIGlkXG4gIGF3YWl0IGNyeXN0YWxsaXplLm9yZGVycy51cGRhdGUoY3J5c3RhbGxpemVPcmRlcklkLCB7XG4gICAgLi4uYmFza2V0LFxuICAgIHBheW1lbnQ6IFtcbiAgICAgIHtcbiAgICAgICAgcHJvdmlkZXI6IFwia2xhcm5hXCIsXG4gICAgICAgIGtsYXJuYToge1xuICAgICAgICAgIG9yZGVySWQ6IGtsYXJuYU9yZGVySWQsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgaHRtbCxcbiAgICBrbGFybmFPcmRlcklkLFxuICAgIGNyeXN0YWxsaXplT3JkZXJJZCxcbiAgfTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGNyeXN0YWxsaXplVG9LbGFybmFPcmRlck1vZGVsKGJhc2tldCkge1xuICBjb25zdCB7IHRvdGFsLCBjYXJ0IH0gPSBiYXNrZXQ7XG5cbiAgY29uc3Qgb3JkZXJfYW1vdW50ID0gdG90YWwuZ3Jvc3MgKiAxMDA7XG5cbiAgcmV0dXJuIHtcbiAgICBvcmRlcl9hbW91bnQsXG4gICAgb3JkZXJfdGF4X2Ftb3VudDogb3JkZXJfYW1vdW50IC0gdG90YWwubmV0ICogMTAwLFxuICAgIG9yZGVyX2xpbmVzOiBjYXJ0Lm1hcChcbiAgICAgICh7XG4gICAgICAgIHNrdSxcbiAgICAgICAgcXVhbnRpdHksXG4gICAgICAgIHByaWNlLFxuICAgICAgICBuYW1lLFxuICAgICAgICBwcm9kdWN0SWQsXG4gICAgICAgIHByb2R1Y3RWYXJpYW50SWQsXG4gICAgICAgIGltYWdlVXJsLFxuICAgICAgfSkgPT4ge1xuICAgICAgICBjb25zdCB7IGdyb3NzLCBuZXQsIHRheCB9ID0gcHJpY2U7XG4gICAgICAgIGNvbnN0IHVuaXRfcHJpY2UgPSBncm9zcyAqIDEwMDtcblxuICAgICAgICBpZiAoc2t1LnN0YXJ0c1dpdGgoXCItLXZvdWNoZXItLVwiKSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZWZlcmVuY2U6IHNrdSxcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICBxdWFudGl0eTogMSxcbiAgICAgICAgICAgIHVuaXRfcHJpY2UsXG4gICAgICAgICAgICB0b3RhbF9hbW91bnQ6IHVuaXRfcHJpY2UsXG4gICAgICAgICAgICB0b3RhbF90YXhfYW1vdW50OiAwLFxuICAgICAgICAgICAgdGF4X3JhdGU6IDAsXG4gICAgICAgICAgICB0eXBlOiBcImRpc2NvdW50XCIsXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHRvdGFsX2Ftb3VudCA9IHVuaXRfcHJpY2UgKiBxdWFudGl0eTtcbiAgICAgICAgY29uc3QgdG90YWxfdGF4X2Ftb3VudCA9IHRvdGFsX2Ftb3VudCAtIG5ldCAqIHF1YW50aXR5ICogMTAwO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICByZWZlcmVuY2U6IHNrdSxcbiAgICAgICAgICB1bml0X3ByaWNlLFxuICAgICAgICAgIHF1YW50aXR5LFxuICAgICAgICAgIHRvdGFsX2Ftb3VudCxcbiAgICAgICAgICB0b3RhbF90YXhfYW1vdW50LFxuICAgICAgICAgIHR5cGU6IFwicGh5c2ljYWxcIixcbiAgICAgICAgICB0YXhfcmF0ZTogdGF4LnBlcmNlbnQgKiAxMDAsXG4gICAgICAgICAgaW1hZ2VfdXJsOiBpbWFnZVVybCxcbiAgICAgICAgICBtZXJjaGFudF9kYXRhOiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICBwcm9kdWN0SWQsXG4gICAgICAgICAgICBwcm9kdWN0VmFyaWFudElkLFxuICAgICAgICAgICAgdGF4R3JvdXA6IHRheCxcbiAgICAgICAgICB9KSxcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICApLFxuICB9O1xufTtcbiIsIi8qKlxuICogUmVhZCBtb3JlIGFib3V0IGhvdyB0byB0YWxrIHRvIHRoZSBLbGFybmEgQVBJIGhlcmU6XG4gKiBodHRwczovL2RldmVsb3BlcnMua2xhcm5hLmNvbS9hcGkvI2ludHJvZHVjdGlvblxuICovXG5cbmNvbnN0IGludmFyaWFudCA9IHJlcXVpcmUoXCJpbnZhcmlhbnRcIik7XG5cbmNvbnN0IEtMQVJOQV9VU0VSTkFNRSA9IHByb2Nlc3MuZW52LktMQVJOQV9VU0VSTkFNRTtcbmNvbnN0IEtMQVJOQV9QQVNTV09SRCA9IHByb2Nlc3MuZW52LktMQVJOQV9QQVNTV09SRDtcblxubGV0IGNsaWVudDtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGdldENsaWVudDogKCkgPT4ge1xuICAgIGNvbnN0IHsgS2xhcm5hIH0gPSByZXF1aXJlKFwiQGNyeXN0YWxsaXplL25vZGUta2xhcm5hXCIpO1xuXG4gICAgaW52YXJpYW50KEtMQVJOQV9VU0VSTkFNRSwgXCJwcm9jZXNzLmVudi5LTEFSTkFfVVNFUk5BTUUgaXMgbm90IGRlZmluZWRcIik7XG4gICAgaW52YXJpYW50KEtMQVJOQV9QQVNTV09SRCwgXCJwcm9jZXNzLmVudi5LTEFSTkFfUEFTU1dPUkQgaXMgbm90IGRlZmluZWRcIik7XG5cbiAgICBpZiAoIWNsaWVudCAmJiBLTEFSTkFfVVNFUk5BTUUgJiYgS0xBUk5BX1BBU1NXT1JEKSB7XG4gICAgICBjbGllbnQgPSBuZXcgS2xhcm5hKHtcbiAgICAgICAgdXNlcm5hbWU6IEtMQVJOQV9VU0VSTkFNRSxcbiAgICAgICAgcGFzc3dvcmQ6IEtMQVJOQV9QQVNTV09SRCxcbiAgICAgICAgYXBpRW5kcG9pbnQ6IFwiYXBpLnBsYXlncm91bmQua2xhcm5hLmNvbVwiLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsaWVudDtcbiAgfSxcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIGNyZWF0ZU1vbGxpZVBheW1lbnQoe1xuICBjaGVja291dE1vZGVsLFxuICBjb250ZXh0LFxufSkge1xuICBjb25zdCBiYXNrZXRTZXJ2aWNlID0gcmVxdWlyZShcIi4uLy4uL2Jhc2tldC1zZXJ2aWNlXCIpO1xuICBjb25zdCBjcnlzdGFsbGl6ZSA9IHJlcXVpcmUoXCIuLi8uLi9jcnlzdGFsbGl6ZVwiKTtcblxuICBjb25zdCB7IGdldENsaWVudCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5cbiAgY29uc3QgeyBiYXNrZXRNb2RlbCwgY3VzdG9tZXIsIGNvbmZpcm1hdGlvblVSTCB9ID0gY2hlY2tvdXRNb2RlbDtcbiAgY29uc3QgeyBzZXJ2aWNlQ2FsbGJhY2tIb3N0LCB1c2VyIH0gPSBjb250ZXh0O1xuXG4gIC8vIEFkZCB0aGUgaWRlbnRpZmllciBmcm9tIHRoZSBjdXJyZW50IGxvZ2dlZCBpbiB1c2VyXG4gIGNvbnN0IGN1c3RvbWVyV2l0aEN1cnJlbnRMb2dnZWRJblVzZXIgPSB7XG4gICAgLi4uY3VzdG9tZXIsXG4gIH07XG4gIGlmICh1c2VyKSB7XG4gICAgY3VzdG9tZXJXaXRoQ3VycmVudExvZ2dlZEluVXNlci5pZGVudGlmaWVyID0gdXNlci5lbWFpbDtcbiAgfVxuXG4gIGNvbnN0IGJhc2tldCA9IGF3YWl0IGJhc2tldFNlcnZpY2UuZ2V0KHsgYmFza2V0TW9kZWwsIGNvbnRleHQgfSk7XG4gIGNvbnN0IHsgdG90YWwgfSA9IGJhc2tldDtcblxuICBsZXQgeyBjcnlzdGFsbGl6ZU9yZGVySWQgfSA9IGJhc2tldE1vZGVsO1xuXG4gIGNvbnN0IGlzU3Vic2NyaXB0aW9uID0gZmFsc2U7XG5cbiAgLyogVXNlIGEgQ3J5c3RhbGxpemUgb3JkZXIgYW5kIHRoZSBmdWxmaWxtZW50IHBpcGVsaW5lcyB0b1xuICAgKiBtYW5hZ2UgdGhlIGxpZmVjeWNsZSBvZiB0aGUgb3JkZXJcbiAgICovXG4gIGlmIChjcnlzdGFsbGl6ZU9yZGVySWQpIHtcbiAgICBhd2FpdCBjcnlzdGFsbGl6ZS5vcmRlcnMudXBkYXRlKGNyeXN0YWxsaXplT3JkZXJJZCwge1xuICAgICAgLi4uYmFza2V0LFxuICAgICAgY3VzdG9tZXI6IGN1c3RvbWVyV2l0aEN1cnJlbnRMb2dnZWRJblVzZXIsXG4gICAgICBtZXRhOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBrZXk6IFwiaXNTdWJzY3JpcHRpb25cIixcbiAgICAgICAgICB2YWx1ZTogaXNTdWJzY3JpcHRpb24gPyBcInllc1wiIDogXCJub1wiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBjcnlzdGFsbGl6ZU9yZGVyID0gYXdhaXQgY3J5c3RhbGxpemUub3JkZXJzLmNyZWF0ZSh7XG4gICAgICAuLi5iYXNrZXQsXG4gICAgICBjdXN0b21lcjogY3VzdG9tZXJXaXRoQ3VycmVudExvZ2dlZEluVXNlcixcbiAgICAgIG1ldGE6IFtcbiAgICAgICAge1xuICAgICAgICAgIGtleTogXCJpc1N1YnNjcmlwdGlvblwiLFxuICAgICAgICAgIHZhbHVlOiBpc1N1YnNjcmlwdGlvbiA/IFwieWVzXCIgOiBcIm5vXCIsXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuICAgIGNyeXN0YWxsaXplT3JkZXJJZCA9IGNyeXN0YWxsaXplT3JkZXIuaWQ7XG4gIH1cblxuICBjb25zdCBtb2xsaWVDbGllbnQgPSBhd2FpdCBnZXRDbGllbnQoKTtcblxuICBjb25zdCBtb2xsaWVDdXN0b21lciA9IGF3YWl0IG1vbGxpZUNsaWVudC5jdXN0b21lcnMuY3JlYXRlKHtcbiAgICBuYW1lOiBgJHtjdXN0b21lci5maXJzdE5hbWV9ICR7Y3VzdG9tZXIubGFzdE5hbWV9YC50cmltKCkgfHwgXCJKYW5lIERvZVwiLFxuICAgIGVtYWlsOiBjdXN0b21lci5hZGRyZXNzZXNbMF0uZW1haWwsXG4gIH0pO1xuXG4gIGNvbnN0IGNvbmZpcm1hdGlvbiA9IG5ldyBVUkwoXG4gICAgY29uZmlybWF0aW9uVVJMLnJlcGxhY2UoXCJ7Y3J5c3RhbGxpemVPcmRlcklkfVwiLCBjcnlzdGFsbGl6ZU9yZGVySWQpXG4gICk7XG5cbiAgY29uc3QgdmFsaWRNb2xsaWVPcmRlciA9IHtcbiAgICBhbW91bnQ6IHtcbiAgICAgIGN1cnJlbmN5OlxuICAgICAgICBwcm9jZXNzLmVudi5NT0xMSUVfREVGQVVMVF9DVVJSRU5DWSB8fCB0b3RhbC5jdXJyZW5jeS50b1VwcGVyQ2FzZSgpLFxuICAgICAgdmFsdWU6IHRvdGFsLmdyb3NzLnRvRml4ZWQoMiksXG4gICAgfSxcbiAgICBjdXN0b21lcklkOiBtb2xsaWVDdXN0b21lci5pZCxcbiAgICBzZXF1ZW5jZVR5cGU6IFwiZmlyc3RcIixcbiAgICBkZXNjcmlwdGlvbjogXCJNb2xsaWUgdGVzdCB0cmFuc2FjdGlvblwiLFxuICAgIHJlZGlyZWN0VXJsOiBjb25maXJtYXRpb24udG9TdHJpbmcoKSxcbiAgICB3ZWJob29rVXJsOiBgJHtzZXJ2aWNlQ2FsbGJhY2tIb3N0fS93ZWJob29rcy9wYXltZW50LXByb3ZpZGVycy9tb2xsaWUvb3JkZXItdXBkYXRlYCxcbiAgICBtZXRhZGF0YTogeyBjcnlzdGFsbGl6ZU9yZGVySWQgfSxcbiAgfTtcblxuICBjb25zdCBtb2xsaWVPcmRlclJlc3BvbnNlID0gYXdhaXQgbW9sbGllQ2xpZW50LnBheW1lbnRzLmNyZWF0ZShcbiAgICB2YWxpZE1vbGxpZU9yZGVyXG4gICk7XG5cbiAgaWYgKGlzU3Vic2NyaXB0aW9uKSB7XG4gICAgYXdhaXQgbW9sbGllQ2xpZW50LmN1c3RvbWVyc19tYW5kYXRlcy5nZXQobW9sbGllT3JkZXJSZXNwb25zZS5tYW5kYXRlSWQsIHtcbiAgICAgIGN1c3RvbWVySWQ6IG1vbGxpZUN1c3RvbWVyLmlkLFxuICAgIH0pO1xuXG4gICAgLy8gRGVmaW5lIHRoZSBzdGFydCBkYXRlIGZvciB0aGUgc3Vic2NyaXB0aW9uXG4gICAgY29uc3Qgc3RhcnREYXRlID0gbmV3IERhdGUoKTtcbiAgICBzdGFydERhdGUuc2V0RGF0ZShzdGFydERhdGUuZ2V0RGF0ZSgpICsgMTUpO1xuICAgIHN0YXJ0RGF0ZS50b0lTT1N0cmluZygpLnNwbGl0KFwiVFwiKVswXTtcblxuICAgIGF3YWl0IG1vbGxpZUNsaWVudC5jdXN0b21lcnNfc3Vic2NyaXB0aW9ucy5jcmVhdGUoe1xuICAgICAgY3VzdG9tZXJJZDogbW9sbGllQ3VzdG9tZXIuaWQsXG4gICAgICBhbW91bnQ6IHZhbGlkTW9sbGllT3JkZXIuYW1vdW50LFxuICAgICAgdGltZXM6IDEsXG4gICAgICBpbnRlcnZhbDogXCIxIG1vbnRoXCIsXG4gICAgICBzdGFydERhdGUsXG4gICAgICBkZXNjcmlwdGlvbjogXCJNb2xsaWUgVGVzdCBzdWJzY3JpcHRpb25cIixcbiAgICAgIHdlYmhvb2tVcmw6IGAke3NlcnZpY2VDYWxsYmFja0hvc3R9L3dlYmhvb2tzL3BheW1lbnQtcHJvdmlkZXJzL21vbGxpZS9zdWJzY3JpcHRpb24tcmVuZXdhbGAsXG4gICAgICBtZXRhZGF0YToge30sXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgY2hlY2tvdXRMaW5rOiBtb2xsaWVPcmRlclJlc3BvbnNlLl9saW5rcy5jaGVja291dC5ocmVmLFxuICAgIGNyeXN0YWxsaXplT3JkZXJJZCxcbiAgfTtcbn07XG4iLCJjb25zdCB7IGdldENsaWVudCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5jb25zdCB0b0NyeXN0YWxsaXplT3JkZXJNb2RlbCA9IHJlcXVpcmUoXCIuL3RvLWNyeXN0YWxsaXplLW9yZGVyLW1vZGVsXCIpO1xuY29uc3QgY3JlYXRlUGF5bWVudCA9IHJlcXVpcmUoXCIuL2NyZWF0ZS1wYXltZW50XCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZW5hYmxlZDogQm9vbGVhbihwcm9jZXNzLmVudi5NT0xMSUVfQVBJX0tFWSksXG4gIGZyb250ZW5kQ29uZmlnOiB7fSxcbiAgZ2V0Q2xpZW50LFxuICB0b0NyeXN0YWxsaXplT3JkZXJNb2RlbCxcbiAgY3JlYXRlUGF5bWVudCxcbn07XG4iLCIvKipcbiAqIFRPRE86IHJldmlldyB3aGF0IGhhcHBlbnMgdG8gdGhlIEdlbmVyYWwgT3JkZXIgVmF0IEdyb3VwIG9uIG11bHRpcGxlIHRheCBncm91cHNcbiAqIG9uIG9yZGVyIChtdWx0LiBpdGVtcyBoYXZpbmcgZGlmZiB2YXRUeXBlcywgaXMgaXQgYSB0aGluZz8pXG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtb2xsaWVUb0NyeXN0YWxsaXplT3JkZXJNb2RlbCh7XG4gIG1vbGxpZU9yZGVyLFxuICBtb2xsaWVDdXN0b21lcixcbn0pIHtcbiAgY29uc3QgY3VzdG9tZXJOYW1lID0gbW9sbGllQ3VzdG9tZXIubmFtZS5zcGxpdChcIiBcIik7XG5cbiAgcmV0dXJuIHtcbiAgICBjdXN0b21lcjoge1xuICAgICAgaWRlbnRpZmllcjogbW9sbGllQ3VzdG9tZXIuZW1haWwsXG4gICAgICBmaXJzdE5hbWU6IGN1c3RvbWVyTmFtZVswXSxcbiAgICAgIG1pZGRsZU5hbWU6IGN1c3RvbWVyTmFtZS5zbGljZSgxLCBjdXN0b21lck5hbWUubGVuZ3RoIC0gMSkuam9pbigpLFxuICAgICAgbGFzdE5hbWU6IGN1c3RvbWVyTmFtZVtjdXN0b21lck5hbWUubGVuZ3RoIC0gMV0sXG4gICAgICBiaXJ0aERhdGU6IERhdGUsXG4gICAgICBhZGRyZXNzZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHR5cGU6IFwiYmlsbGluZ1wiLFxuICAgICAgICAgIGZpcnN0TmFtZTogY3VzdG9tZXJOYW1lWzBdLFxuICAgICAgICAgIG1pZGRsZU5hbWU6IGN1c3RvbWVyTmFtZS5zbGljZSgxLCBjdXN0b21lck5hbWUubGVuZ3RoIC0gMSkuam9pbigpLFxuICAgICAgICAgIGxhc3ROYW1lOiBjdXN0b21lck5hbWVbY3VzdG9tZXJOYW1lLmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHN0cmVldDogXCJUZXN0IGxpbmUxXCIsXG4gICAgICAgICAgc3RyZWV0MjogXCJUZXN0IGxpbmUyXCIsXG4gICAgICAgICAgcG9zdGFsQ29kZTogXCJUZXN0IHBvc3RhbF9jb2RlXCIsXG4gICAgICAgICAgY2l0eTogXCJUZXN0IGNpdHlcIixcbiAgICAgICAgICBzdGF0ZTogXCJUZXN0IHN0YXRlXCIsXG4gICAgICAgICAgY291bnRyeTogXCJUZXN0IGNvdW50cnlcIixcbiAgICAgICAgICBwaG9uZTogXCJUZXN0IFBob25lXCIsXG4gICAgICAgICAgZW1haWw6IG1vbGxpZUN1c3RvbWVyLmVtYWlsLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogXCJkZWxpdmVyeVwiLFxuICAgICAgICAgIGZpcnN0TmFtZTogY3VzdG9tZXJOYW1lWzBdLFxuICAgICAgICAgIG1pZGRsZU5hbWU6IGN1c3RvbWVyTmFtZS5zbGljZSgxLCBjdXN0b21lck5hbWUubGVuZ3RoIC0gMSkuam9pbigpLFxuICAgICAgICAgIGxhc3ROYW1lOiBjdXN0b21lck5hbWVbY3VzdG9tZXJOYW1lLmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHN0cmVldDogXCJUZXN0IGxpbmUxXCIsXG4gICAgICAgICAgc3RyZWV0MjogXCJUZXN0IGxpbmUyXCIsXG4gICAgICAgICAgcG9zdGFsQ29kZTogXCJUZXN0IHBvc3RhbF9jb2RlXCIsXG4gICAgICAgICAgY2l0eTogXCJUZXN0IGNpdHlcIixcbiAgICAgICAgICBzdGF0ZTogXCJUZXN0IHN0YXRlXCIsXG4gICAgICAgICAgY291bnRyeTogXCJUZXN0IGNvdW50cnlcIixcbiAgICAgICAgICBwaG9uZTogXCJUZXN0IFBob25lXCIsXG4gICAgICAgICAgZW1haWw6IG1vbGxpZUN1c3RvbWVyLmVtYWlsLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHBheW1lbnQ6IFtcbiAgICAgIHtcbiAgICAgICAgcHJvdmlkZXI6IFwiY3VzdG9tXCIsXG4gICAgICAgIGN1c3RvbToge1xuICAgICAgICAgIHByb3BlcnRpZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvcGVydHk6IFwicmVzb3VyY2VcIixcbiAgICAgICAgICAgICAgdmFsdWU6IG1vbGxpZU9yZGVyLnJlc291cmNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvcGVydHk6IFwicmVzb3VyY2VfaWRcIixcbiAgICAgICAgICAgICAgdmFsdWU6IG1vbGxpZU9yZGVyLmlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvcGVydHk6IFwibW9kZVwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbW9sbGllT3JkZXIubW9kZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHByb3BlcnR5OiBcIm1ldGhvZFwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbW9sbGllT3JkZXIubWV0aG9kLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvcGVydHk6IFwic3RhdHVzXCIsXG4gICAgICAgICAgICAgIHZhbHVlOiBtb2xsaWVPcmRlci5zdGF0dXMsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBwcm9wZXJ0eTogXCJwcm9maWxlSWRcIixcbiAgICAgICAgICAgICAgdmFsdWU6IG1vbGxpZU9yZGVyLnByb2ZpbGVJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHByb3BlcnR5OiBcIm1hbmRhdGVJZFwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbW9sbGllT3JkZXIubWFuZGF0ZUlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgcHJvcGVydHk6IFwiY3VzdG9tZXJJZFwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbW9sbGllT3JkZXIuY3VzdG9tZXJJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHByb3BlcnR5OiBcInNlcXVlbmNlVHlwZVwiLFxuICAgICAgICAgICAgICB2YWx1ZTogbW9sbGllT3JkZXIuc2VxdWVuY2VUeXBlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICBdLFxuICB9O1xufTtcbiIsImNvbnN0IGludmFyaWFudCA9IHJlcXVpcmUoXCJpbnZhcmlhbnRcIik7XG5cbmNvbnN0IE1PTExJRV9BUElfS0VZID0gcHJvY2Vzcy5lbnYuTU9MTElFX0FQSV9LRVk7XG5cbmxldCBjbGllbnQ7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Q2xpZW50OiAoKSA9PiB7XG4gICAgaW52YXJpYW50KE1PTExJRV9BUElfS0VZLCBcInByb2Nlc3MuZW52Lk1PTExJRV9BUElfS0VZIGlzIG5vdCBkZWZpbmVkXCIpO1xuXG4gICAgaWYgKCFjbGllbnQpIHtcbiAgICAgIGNvbnN0IHsgY3JlYXRlTW9sbGllQ2xpZW50IH0gPSByZXF1aXJlKFwiQG1vbGxpZS9hcGktY2xpZW50XCIpO1xuICAgICAgY2xpZW50ID0gY3JlYXRlTW9sbGllQ2xpZW50KHsgYXBpS2V5OiBwcm9jZXNzLmVudi5NT0xMSUVfQVBJX0tFWSB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2xpZW50O1xuICB9LFxufTtcbiIsImFzeW5jIGZ1bmN0aW9uIGNvbmZpcm1QYXlwYWxQYXltZW50KHsgY2hlY2tvdXRNb2RlbCwgb3JkZXJJZCwgY29udGV4dCB9KSB7XG4gIGNvbnN0IGNoZWNrb3V0Tm9kZUpzc2RrID0gcmVxdWlyZShcIkBwYXlwYWwvY2hlY2tvdXQtc2VydmVyLXNka1wiKTtcbiAgXG4gIGNvbnN0IGNyeXN0YWxsaXplID0gcmVxdWlyZShcIi4uLy4uL2NyeXN0YWxsaXplXCIpO1xuICBjb25zdCBiYXNrZXRTZXJ2aWNlID0gcmVxdWlyZShcIi4uLy4uL2Jhc2tldC1zZXJ2aWNlXCIpO1xuICBjb25zdCB7IHBheXBhbDogUGF5cGFsQ2xpZW50IH0gPSByZXF1aXJlKFwiLi9pbml0LWNsaWVudFwiKTtcbiAgY29uc3QgdG9DcnlzdGFsbGl6ZU9yZGVyTW9kZWwgPSByZXF1aXJlKFwiLi90by1jcnlzdGFsbGl6ZS1vcmRlci1tb2RlbFwiKTtcblxuICB0cnkge1xuICAgIGNvbnN0IHsgYmFza2V0TW9kZWwgfSA9IGNoZWNrb3V0TW9kZWw7XG4gICAgY29uc3QgYmFza2V0ID0gYXdhaXQgYmFza2V0U2VydmljZS5nZXQoeyBiYXNrZXRNb2RlbCwgY29udGV4dCB9KTtcbiAgXG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBQYXlwYWxDbGllbnQoKS5leGVjdXRlKFxuICAgICAgbmV3IGNoZWNrb3V0Tm9kZUpzc2RrLm9yZGVycy5PcmRlcnNHZXRSZXF1ZXN0KG9yZGVySWQpXG4gICAgKTtcblxuICAgIGNvbnN0IG9yZGVyID0gYXdhaXQgY3J5c3RhbGxpemUub3JkZXJzLmNyZWF0ZShcbiAgICAgIHRvQ3J5c3RhbGxpemVPcmRlck1vZGVsKGJhc2tldCwgcmVzcG9uc2UucmVzdWx0KVxuICAgICk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIG9yZGVySWQ6IG9yZGVyLmlkLFxuICAgIH07XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgfVxuICBcbiAgcmV0dXJuIHtcbiAgICBzdWNjZXNzOiBmYWxzZVxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNvbmZpcm1QYXlwYWxQYXltZW50O1xuIiwiXG5hc3luYyBmdW5jdGlvbiBjcmVhdGVQYXlwYWxQYXltZW50KHsgY2hlY2tvdXRNb2RlbCwgY29udGV4dCB9KSB7XG4gIGNvbnN0IHBheXBhbCA9IHJlcXVpcmUoXCJAcGF5cGFsL2NoZWNrb3V0LXNlcnZlci1zZGtcIik7XG5cbiAgY29uc3QgeyBwYXlwYWw6IFBheXBhbENsaWVudCB9ID0gcmVxdWlyZShcIi4vaW5pdC1jbGllbnRcIik7XG4gIGNvbnN0IGJhc2tldFNlcnZpY2UgPSByZXF1aXJlKFwiLi4vLi4vYmFza2V0LXNlcnZpY2VcIik7XG5cbiAgY29uc3QgeyBiYXNrZXRNb2RlbCB9ID0gY2hlY2tvdXRNb2RlbDtcblxuICAvLyBHZXQgYSB2ZXJpZmllZCBiYXNrZXQgZnJvbSB0aGUgYmFza2V0IHNlcnZpY2VcbiAgY29uc3QgYmFza2V0ID0gYXdhaXQgYmFza2V0U2VydmljZS5nZXQoeyBiYXNrZXRNb2RlbCwgY29udGV4dCB9KTtcblxuICBjb25zdCByZXF1ZXN0ID0gbmV3IHBheXBhbC5vcmRlcnMuT3JkZXJzQ3JlYXRlUmVxdWVzdCgpO1xuICBcbiAgLy8gR2V0IHRoZSBjb21wbGV0ZSByZXNvdXJjZSByZXByZXNlbnRhdGlvblxuICByZXF1ZXN0LnByZWZlcihcInJldHVybj1yZXByZXNlbnRhdGlvblwiKTtcbiAgXG4gIHJlcXVlc3QucmVxdWVzdEJvZHkoe1xuICAgIGludGVudDogXCJDQVBUVVJFXCIsXG4gICAgcHVyY2hhc2VfdW5pdHM6IFtcbiAgICAgIHtcbiAgICAgICAgYW1vdW50OiB7XG4gICAgICAgICAgY3VycmVuY3lfY29kZTogYmFza2V0LnRvdGFsLmN1cnJlbmN5LFxuICAgICAgICAgIHZhbHVlOiBiYXNrZXQudG90YWwuZ3Jvc3MudG9TdHJpbmcoKSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgXSxcbiAgfSk7XG5cbiAgbGV0IG9yZGVyO1xuICB0cnkge1xuICAgIG9yZGVyID0gYXdhaXQgUGF5cGFsQ2xpZW50KCkuZXhlY3V0ZShyZXF1ZXN0KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IGZhbHNlIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgb3JkZXJJZDogb3JkZXIucmVzdWx0LmlkLFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGNyZWF0ZVBheXBhbFBheW1lbnQ7XG4iLCJjb25zdCBjcmVhdGVQYXlwYWxQYXltZW50ID0gcmVxdWlyZShcIi4vY3JlYXRlLXBheW1lbnRcIik7XG5jb25zdCBjb25maXJtUGF5cGFsUGF5bWVudCA9IHJlcXVpcmUoXCIuL2NvbmZpcm0tcGF5bWVudFwiKTtcblxuY29uc3QgUEFZUEFMX0NMSUVOVF9JRCA9IHByb2Nlc3MuZW52LlBBWVBBTF9DTElFTlRfSUQ7XG5jb25zdCBQQVlQQUxfQ0xJRU5UX1NFQ1JFVCA9IHByb2Nlc3MuZW52LlBBWVBBTF9DTElFTlRfU0VDUkVUO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZW5hYmxlZDogQm9vbGVhbihQQVlQQUxfQ0xJRU5UX0lEICYmIFBBWVBBTF9DTElFTlRfU0VDUkVUKSxcbiAgZnJvbnRlbmRDb25maWc6IHtcbiAgICBjbGllbnRJZDogUEFZUEFMX0NMSUVOVF9JRCxcbiAgICBjdXJyZW5jeTogXCJcIixcbiAgfSxcbiAgY3JlYXRlUGF5cGFsUGF5bWVudCxcbiAgY29uZmlybVBheXBhbFBheW1lbnQsXG59O1xuIiwiZnVuY3Rpb24gZ2V0Q2xpZW50KCkge1xuICBjb25zdCBjaGVja291dE5vZGVKc3NkayA9IHJlcXVpcmUoXCJAcGF5cGFsL2NoZWNrb3V0LXNlcnZlci1zZGtcIik7XG5cbiAgY29uc3QgY2xpZW50SWQgPSBwcm9jZXNzLmVudi5QQVlQQUxfQ0xJRU5UX0lEIHx8IFwiUEFZUEFMLVNBTkRCT1gtQ0xJRU5ULUlEXCI7XG4gIGNvbnN0IGNsaWVudFNlY3JldCA9XG4gICAgcHJvY2Vzcy5lbnYuUEFZUEFMX0NMSUVOVF9TRUNSRVQgfHwgXCJQQVlQQUwtU0FOREJPWC1DTElFTlQtU0VDUkVUXCI7XG5cbiAgLy8gY29uc3QgY2xpZW50RW52ID1cbiAgLy8gICBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gXCJwcm9kdWN0aW9uXCJcbiAgLy8gICAgID8gbmV3IGNoZWNrb3V0Tm9kZUpzc2RrLmNvcmUuTGl2ZUVudmlyb25tZW50KGNsaWVudElkLCBjbGllbnRTZWNyZXQpXG4gIC8vICAgICA6IG5ldyBjaGVja291dE5vZGVKc3Nkay5jb3JlLlNhbmRib3hFbnZpcm9ubWVudChjbGllbnRJZCwgY2xpZW50U2VjcmV0KTtcblxuICBjb25zdCBjbGllbnRFbnYgPSBuZXcgY2hlY2tvdXROb2RlSnNzZGsuY29yZS5TYW5kYm94RW52aXJvbm1lbnQoXG4gICAgY2xpZW50SWQsXG4gICAgY2xpZW50U2VjcmV0XG4gICk7XG5cbiAgcmV0dXJuIG5ldyBjaGVja291dE5vZGVKc3Nkay5jb3JlLlBheVBhbEh0dHBDbGllbnQoY2xpZW50RW52KTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7IHBheXBhbDogZ2V0Q2xpZW50IH07XG4iLCJmdW5jdGlvbiB0b0NyeXN0YWxsaXplT3JkZXJNb2RlbChiYXNrZXQsIG9yZGVyKSB7XG4gIGNvbnN0IHsgcGF5ZXIsIHB1cmNoYXNlX3VuaXRzIH0gPSBvcmRlcjtcbiAgY29uc3QgeyBzaGlwcGluZyB9ID0gcHVyY2hhc2VfdW5pdHNbMF07XG4gIGNvbnN0IHsgYWRkcmVzcyB9ID0gc2hpcHBpbmc7XG4gIGNvbnN0IG9yZGVySWQgPSBvcmRlci5pZDtcblxuICAvKipcbiAgICogVXNlIGVtYWlsIG9yIHBheWVyIGlkIGFzIHRoZSBjdXN0b21lciBpZGVudGlmaWVyIGluIENyeXN0YWxsaXplLlxuICAgKi9cbiAgY29uc3QgaWRlbnRpZmllciA9IG9yZGVyLnBheWVyLmVtYWlsX2FkZHJlc3MgfHwgb3JkZXIucGF5ZXIucGF5ZXJfaWQ7XG5cbiAgcmV0dXJuIHtcbiAgICBjYXJ0OiBiYXNrZXQuY2FydCxcbiAgICB0b3RhbDogYmFza2V0LnRvdGFsLFxuICAgIHBheW1lbnQ6IFtcbiAgICAgIHtcbiAgICAgICAgcHJvdmlkZXI6IFwicGF5cGFsXCIsXG4gICAgICAgIHBheXBhbDoge1xuICAgICAgICAgIG9yZGVySWQsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gICAgbWV0YTogW1xuICAgICAge1xuICAgICAgICBrZXk6IFwiUEFZUEFMX09SREVSX1NUQVRVU1wiLFxuICAgICAgICB2YWx1ZTogb3JkZXIuc3RhdHVzLFxuICAgICAgfSxcbiAgICBdLFxuICAgIGN1c3RvbWVyOiB7XG4gICAgICBpZGVudGlmaWVyLFxuICAgICAgZmlyc3ROYW1lOiBwYXllcj8ubmFtZT8uZ2l2ZW5fbmFtZSB8fCBcIlwiLFxuICAgICAgbWlkZGxlTmFtZTogXCJcIixcbiAgICAgIGxhc3ROYW1lOiBwYXllcj8ubmFtZT8uc3VybmFtZSB8fCBcIlwiLFxuICAgICAgYWRkcmVzc2VzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiBcImRlbGl2ZXJ5XCIsXG4gICAgICAgICAgZmlyc3ROYW1lOiBwYXllcj8ubmFtZT8uZ2l2ZW5fbmFtZSB8fCBcIlwiLFxuICAgICAgICAgIG1pZGRsZU5hbWU6IFwiXCIsXG4gICAgICAgICAgbGFzdE5hbWU6IHBheWVyPy5uYW1lPy5zdXJuYW1lIHx8IFwiXCIsXG4gICAgICAgICAgc3RyZWV0OiBhZGRyZXNzPy5hZGRyZXNzX2xpbmVfMSxcbiAgICAgICAgICBzdHJlZXQyOiBcIlwiLFxuICAgICAgICAgIHBvc3RhbENvZGU6IGFkZHJlc3M/LnBvc3RhbF9jb2RlIHx8IFwiXCIsXG4gICAgICAgICAgY2l0eTogYWRkcmVzcz8uYWRtaW5fYXJlYV8yIHx8IFwiXCIsXG4gICAgICAgICAgc3RhdGU6IGFkZHJlc3M/LmFkbWluX2FyZWFfMSB8fCBcIlwiLFxuICAgICAgICAgIGNvdW50cnk6IGFkZHJlc3M/LmNvdW50cnlfY29kZSB8fCBcIlwiLFxuICAgICAgICAgIHBob25lOiBcIlwiLFxuICAgICAgICAgIGVtYWlsOiBwYXllcj8uZW1haWxfYWRkcmVzcyB8fCBcIlwiLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICB9O1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHRvQ3J5c3RhbGxpemVPcmRlck1vZGVsO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBjb25maXJtT3JkZXIoe1xuICBwYXltZW50SW50ZW50SWQsXG4gIGNoZWNrb3V0TW9kZWwsXG4gIGNvbnRleHQsXG59KSB7XG4gIGNvbnN0IGNyeXN0YWxsaXplID0gcmVxdWlyZShcIi4uLy4uL2NyeXN0YWxsaXplXCIpO1xuICBjb25zdCBiYXNrZXRTZXJ2aWNlID0gcmVxdWlyZShcIi4uLy4uL2Jhc2tldC1zZXJ2aWNlXCIpO1xuXG4gIGNvbnN0IHRvQ3J5c3RhbGxpemVPcmRlck1vZGVsID0gcmVxdWlyZShcIi4vdG8tY3J5c3RhbGxpemUtb3JkZXItbW9kZWxcIik7XG5cbiAgY29uc3QgeyBiYXNrZXRNb2RlbCB9ID0gY2hlY2tvdXRNb2RlbDtcbiAgY29uc3QgeyB1c2VyIH0gPSBjb250ZXh0O1xuXG4gIGNvbnN0IGJhc2tldCA9IGF3YWl0IGJhc2tldFNlcnZpY2UuZ2V0KHsgYmFza2V0TW9kZWwsIGNvbnRleHQgfSk7XG5cbiAgLy8gUHJlcGFyZSBhIHZhbGlkIG1vZGVsIGZvciBDcnlzdGFsbGl6ZSBvcmRlciBpbnRha2VcbiAgY29uc3QgY3J5c3RhbGxpemVPcmRlck1vZGVsID0gYXdhaXQgdG9DcnlzdGFsbGl6ZU9yZGVyTW9kZWwoe1xuICAgIGJhc2tldCxcbiAgICBjaGVja291dE1vZGVsLFxuICAgIHBheW1lbnRJbnRlbnRJZCxcbiAgICBjdXN0b21lcklkZW50aWZpZXI6XG4gICAgICB1c2VyPy5lbWFpbCB8fCBjaGVja291dE1vZGVsPy5jdXN0b21lcj8uYWRkcmVzc2VzPy5bMF0/LmVtYWlsIHx8IFwiXCIsXG4gIH0pO1xuXG4gIC8qKlxuICAgKiBSZWNvcmQgdGhlIG9yZGVyIGluIENyeXN0YWxsaXplXG4gICAqIE1hbmFnZSB0aGUgb3JkZXIgbGlmZWN5Y2xlIGJ5IHVzaW5nIHRoZSBmdWxmaWxtZW50IHBpcGVsaW5lczpcbiAgICogaHR0cHM6Ly9jcnlzdGFsbGl6ZS5jb20vbGVhcm4vdXNlci1ndWlkZXMvb3JkZXJzLWFuZC1mdWxmaWxtZW50XG4gICAqL1xuICBjb25zdCBvcmRlciA9IGF3YWl0IGNyeXN0YWxsaXplLm9yZGVycy5jcmVhdGUoY3J5c3RhbGxpemVPcmRlck1vZGVsKTtcblxuICByZXR1cm4ge1xuICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgb3JkZXJJZDogb3JkZXIuaWQsXG4gIH07XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBhc3luYyBmdW5jdGlvbiBjcmVhdGVQYXltZW50SW50ZW50KHtcbiAgY2hlY2tvdXRNb2RlbCxcbiAgY29uZmlybSA9IGZhbHNlLFxuICBwYXltZW50TWV0aG9kSWQsXG4gIGNvbnRleHQsXG59KSB7XG4gIGNvbnN0IGJhc2tldFNlcnZpY2UgPSByZXF1aXJlKFwiLi4vLi4vYmFza2V0LXNlcnZpY2VcIik7XG4gIGNvbnN0IHsgZ2V0Q2xpZW50IH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcblxuICBjb25zdCB7IGJhc2tldE1vZGVsIH0gPSBjaGVja291dE1vZGVsO1xuXG4gIGNvbnN0IGJhc2tldCA9IGF3YWl0IGJhc2tldFNlcnZpY2UuZ2V0KHsgYmFza2V0TW9kZWwsIGNvbnRleHQgfSk7XG5cbiAgY29uc3QgcGF5bWVudEludGVudCA9IGF3YWl0IGdldENsaWVudCgpLnBheW1lbnRJbnRlbnRzLmNyZWF0ZSh7XG4gICAgYW1vdW50OiBiYXNrZXQudG90YWwuZ3Jvc3MgKiAxMDAsXG4gICAgY3VycmVuY3k6IGJhc2tldC50b3RhbC5jdXJyZW5jeSxcbiAgICBjb25maXJtLFxuICAgIHBheW1lbnRfbWV0aG9kOiBwYXltZW50TWV0aG9kSWQsXG4gIH0pO1xuXG4gIHJldHVybiBwYXltZW50SW50ZW50O1xufTtcbiIsImNvbnN0IGNyZWF0ZVBheW1lbnRJbnRlbnQgPSByZXF1aXJlKFwiLi9jcmVhdGUtcGF5bWVudC1pbnRlbnRcIik7XG5jb25zdCBjb25maXJtT3JkZXIgPSByZXF1aXJlKFwiLi9jb25maXJtLW9yZGVyXCIpO1xuXG5jb25zdCBTVFJJUEVfU0VDUkVUX0tFWSA9IHByb2Nlc3MuZW52LlNUUklQRV9TRUNSRVRfS0VZO1xuY29uc3QgU1RSSVBFX1BVQkxJU0hBQkxFX0tFWSA9IHByb2Nlc3MuZW52LlNUUklQRV9QVUJMSVNIQUJMRV9LRVk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBlbmFibGVkOiBCb29sZWFuKFNUUklQRV9TRUNSRVRfS0VZICYmIFNUUklQRV9QVUJMSVNIQUJMRV9LRVkpLFxuXG4gIC8vIFRoZSByZXF1aXJlZCBmcm9udGVuZCBjb25maWdcbiAgZnJvbnRlbmRDb25maWc6IHtcbiAgICBwdWJsaXNoYWJsZUtleTogU1RSSVBFX1BVQkxJU0hBQkxFX0tFWSxcbiAgfSxcbiAgY3JlYXRlUGF5bWVudEludGVudCxcbiAgY29uZmlybU9yZGVyLFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gc3RyaXBlVG9DcnlzdGFsbGl6ZU9yZGVyTW9kZWwoe1xuICBiYXNrZXQsXG4gIGNoZWNrb3V0TW9kZWwsXG4gIHBheW1lbnRJbnRlbnRJZCxcbiAgY3VzdG9tZXJJZGVudGlmaWVyLFxufSkge1xuICBjb25zdCB7IGdldENsaWVudCB9ID0gcmVxdWlyZShcIi4vdXRpbHNcIik7XG5cbiAgY29uc3QgcGF5bWVudEludGVudCA9IGF3YWl0IGdldENsaWVudCgpLnBheW1lbnRJbnRlbnRzLnJldHJpZXZlKFxuICAgIHBheW1lbnRJbnRlbnRJZFxuICApO1xuXG4gIGNvbnN0IHsgZGF0YSB9ID0gcGF5bWVudEludGVudC5jaGFyZ2VzO1xuICBjb25zdCBjaGFyZ2UgPSBkYXRhWzBdO1xuXG4gIGNvbnN0IGN1c3RvbWVyTmFtZSA9IGNoYXJnZS5iaWxsaW5nX2RldGFpbHMubmFtZS5zcGxpdChcIiBcIik7XG4gIGxldCBlbWFpbCA9IGNoYXJnZS5yZWNlaXB0X2VtYWlsO1xuICBpZiAoIWVtYWlsICYmIGNoZWNrb3V0TW9kZWwuY3VzdG9tZXIgJiYgY2hlY2tvdXRNb2RlbC5jdXN0b21lci5hZGRyZXNzZXMpIHtcbiAgICBjb25zdCBhZGRyZXNzV2l0aEVtYWlsID0gY2hlY2tvdXRNb2RlbC5jdXN0b21lci5hZGRyZXNzZXMuZmluZChcbiAgICAgIChhKSA9PiAhIWEuZW1haWxcbiAgICApO1xuICAgIGlmIChhZGRyZXNzV2l0aEVtYWlsKSB7XG4gICAgICBlbWFpbCA9IGFkZHJlc3NXaXRoRW1haWwuZW1haWw7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbWV0YSA9IFtdO1xuICBpZiAocGF5bWVudEludGVudC5tZXJjaGFudF9kYXRhKSB7XG4gICAgbWV0YS5wdXNoKHtcbiAgICAgIGtleTogXCJzdHJpcGVNZXJjaGFudERhdGFcIixcbiAgICAgIHZhbHVlOiBKU09OLnN0cmluZ2lmeShwYXltZW50SW50ZW50Lm1lcmNoYW50X2RhdGEpLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBjYXJ0OiBiYXNrZXQuY2FydCxcbiAgICB0b3RhbDogYmFza2V0LnRvdGFsLFxuICAgIG1ldGEsXG4gICAgY3VzdG9tZXI6IHtcbiAgICAgIGlkZW50aWZpZXI6IGN1c3RvbWVySWRlbnRpZmllcixcbiAgICAgIGZpcnN0TmFtZTogY3VzdG9tZXJOYW1lWzBdLFxuICAgICAgbWlkZGxlTmFtZTogY3VzdG9tZXJOYW1lLnNsaWNlKDEsIGN1c3RvbWVyTmFtZS5sZW5ndGggLSAxKS5qb2luKCksXG4gICAgICBsYXN0TmFtZTogY3VzdG9tZXJOYW1lW2N1c3RvbWVyTmFtZS5sZW5ndGggLSAxXSxcbiAgICAgIGJpcnRoRGF0ZTogRGF0ZSxcbiAgICAgIGFkZHJlc3NlczogW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogXCJiaWxsaW5nXCIsXG4gICAgICAgICAgZmlyc3ROYW1lOiBjdXN0b21lck5hbWVbMF0sXG4gICAgICAgICAgbWlkZGxlTmFtZTogY3VzdG9tZXJOYW1lLnNsaWNlKDEsIGN1c3RvbWVyTmFtZS5sZW5ndGggLSAxKS5qb2luKCksXG4gICAgICAgICAgbGFzdE5hbWU6IGN1c3RvbWVyTmFtZVtjdXN0b21lck5hbWUubGVuZ3RoIC0gMV0sXG4gICAgICAgICAgc3RyZWV0OiBjaGFyZ2UuYmlsbGluZ19kZXRhaWxzLmFkZHJlc3MubGluZTEsXG4gICAgICAgICAgc3RyZWV0MjogY2hhcmdlLmJpbGxpbmdfZGV0YWlscy5hZGRyZXNzLmxpbmUyLFxuICAgICAgICAgIHBvc3RhbENvZGU6IGNoYXJnZS5iaWxsaW5nX2RldGFpbHMuYWRkcmVzcy5wb3N0YWxfY29kZSxcbiAgICAgICAgICBjaXR5OiBjaGFyZ2UuYmlsbGluZ19kZXRhaWxzLmFkZHJlc3MuY2l0eSxcbiAgICAgICAgICBzdGF0ZTogY2hhcmdlLmJpbGxpbmdfZGV0YWlscy5hZGRyZXNzLnN0YXRlLFxuICAgICAgICAgIGNvdW50cnk6IGNoYXJnZS5iaWxsaW5nX2RldGFpbHMuYWRkcmVzcy5jb3VudHJ5LFxuICAgICAgICAgIHBob25lOiBjaGFyZ2UuYmlsbGluZ19kZXRhaWxzLnBob25lLFxuICAgICAgICAgIGVtYWlsLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogXCJkZWxpdmVyeVwiLFxuICAgICAgICAgIGZpcnN0TmFtZTogY3VzdG9tZXJOYW1lWzBdLFxuICAgICAgICAgIG1pZGRsZU5hbWU6IGN1c3RvbWVyTmFtZS5zbGljZSgxLCBjdXN0b21lck5hbWUubGVuZ3RoIC0gMSkuam9pbigpLFxuICAgICAgICAgIGxhc3ROYW1lOiBjdXN0b21lck5hbWVbY3VzdG9tZXJOYW1lLmxlbmd0aCAtIDFdLFxuICAgICAgICAgIHN0cmVldDogY2hhcmdlLmJpbGxpbmdfZGV0YWlscy5hZGRyZXNzLmxpbmUxLFxuICAgICAgICAgIHN0cmVldDI6IGNoYXJnZS5iaWxsaW5nX2RldGFpbHMuYWRkcmVzcy5saW5lMixcbiAgICAgICAgICBwb3N0YWxDb2RlOiBjaGFyZ2UuYmlsbGluZ19kZXRhaWxzLmFkZHJlc3MucG9zdGFsX2NvZGUsXG4gICAgICAgICAgY2l0eTogY2hhcmdlLmJpbGxpbmdfZGV0YWlscy5hZGRyZXNzLmNpdHksXG4gICAgICAgICAgc3RhdGU6IGNoYXJnZS5iaWxsaW5nX2RldGFpbHMuYWRkcmVzcy5zdGF0ZSxcbiAgICAgICAgICBjb3VudHJ5OiBjaGFyZ2UuYmlsbGluZ19kZXRhaWxzLmFkZHJlc3MuY291bnRyeSxcbiAgICAgICAgICBwaG9uZTogY2hhcmdlLmJpbGxpbmdfZGV0YWlscy5waG9uZSxcbiAgICAgICAgICBlbWFpbCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICBwYXltZW50OiBbXG4gICAgICB7XG4gICAgICAgIHByb3ZpZGVyOiBcInN0cmlwZVwiLFxuICAgICAgICBzdHJpcGU6IHtcbiAgICAgICAgICBzdHJpcGU6IGNoYXJnZS5pZCxcbiAgICAgICAgICBjdXN0b21lcklkOiBjaGFyZ2UuY3VzdG9tZXIsXG4gICAgICAgICAgb3JkZXJJZDogY2hhcmdlLnBheW1lbnRfaW50ZW50LFxuICAgICAgICAgIHBheW1lbnRNZXRob2Q6IGNoYXJnZS5wYXltZW50X21ldGhvZF9kZXRhaWxzLnR5cGUsXG4gICAgICAgICAgcGF5bWVudE1ldGhvZElkOiBjaGFyZ2UucGF5bWVudF9tZXRob2QsXG4gICAgICAgICAgcGF5bWVudEludGVudElkOiBjaGFyZ2UucGF5bWVudF9pbnRlbnQsXG4gICAgICAgICAgc3Vic2NyaXB0aW9uSWQ6IGNoYXJnZS5zdWJzY3JpcHRpb24sXG4gICAgICAgICAgbWV0YWRhdGE6IFwiXCIsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIF0sXG4gIH07XG59O1xuIiwiY29uc3QgaW52YXJpYW50ID0gcmVxdWlyZShcImludmFyaWFudFwiKTtcblxuY29uc3QgU1RSSVBFX1NFQ1JFVF9LRVkgPSBwcm9jZXNzLmVudi5TVFJJUEVfU0VDUkVUX0tFWTtcblxubGV0IGNsaWVudDtcbm1vZHVsZS5leHBvcnRzID0ge1xuICBnZXRDbGllbnQ6ICgpID0+IHtcbiAgICBpbnZhcmlhbnQoXG4gICAgICBTVFJJUEVfU0VDUkVUX0tFWSxcbiAgICAgIFwicHJvY2Vzcy5lbnYuU1RSSVBFX1NFQ1JFVF9LRVkgaXMgbm90IGRlZmluZWRcIlxuICAgICk7XG5cbiAgICBpZiAoIWNsaWVudCkge1xuICAgICAgY29uc3Qgc3RyaXBlU2RrID0gcmVxdWlyZShcInN0cmlwZVwiKTtcbiAgICAgIGNsaWVudCA9IHN0cmlwZVNkayhTVFJJUEVfU0VDUkVUX0tFWSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsaWVudDtcbiAgfSxcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIHZpcHBzRmFsbGJhY2soe1xuICBjcnlzdGFsbGl6ZU9yZGVySWQsXG4gIG9uU3VjY2Vzc1VSTCxcbiAgb25FcnJvclVSTCxcbn0pIHtcbiAgY29uc3QgY3J5c3RhbGxpemUgPSByZXF1aXJlKFwiLi4vLi4vY3J5c3RhbGxpemVcIik7XG5cbiAgY29uc3QgeyBnZXRDbGllbnQgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuXG4gIGxldCByZWRpcmVjdFRvID0gXCJcIjtcblxuICBjb25zdCB2aXBwc0NsaWVudCA9IGF3YWl0IGdldENsaWVudCgpO1xuXG4gIC8vIFJldHJpZXZlIHRoZSBWaXBwcyBvcmRlciB0byBnZXQgdHJhbnNhY3Rpb24gZGV0YWlsc1xuICBjb25zdCBvcmRlciA9IGF3YWl0IHZpcHBzQ2xpZW50LmdldE9yZGVyRGV0YWlscyh7XG4gICAgb3JkZXJJZDogY3J5c3RhbGxpemVPcmRlcklkLFxuICB9KTtcbiAgY29uc3QgW2xhc3RUcmFuc2FjdGlvbkxvZ0VudHJ5XSA9IG9yZGVyLnRyYW5zYWN0aW9uTG9nSGlzdG9yeS5zb3J0KFxuICAgIChhLCBiKSA9PiBuZXcgRGF0ZShiLnRpbWVTdGFtcCkgLSBuZXcgRGF0ZShhLnRpbWVTdGFtcClcbiAgKTtcblxuICAvKipcbiAgICogSWYgdGhlIHRyYW5zYWN0aW9uIGxvZ3MgbGFzdCBlbnRyeSBoYXMgc3RhdHVzXG4gICAqIFJFU0VSVkUsIHRoZW4gdGhlIGFtb3VudCBoYXMgYmVlbiBzdWNjZXNzZnVsbHlcbiAgICogcmVzZXJ2ZWQgb24gdGhlIHVzZXIgYWNjb3VudCwgYW5kIHdlIGNhbiBzaG93XG4gICAqIHRoZSBjb25maXJtYXRpb24gcGFnZVxuICAgKi9cbiAgaWYgKFxuICAgIGxhc3RUcmFuc2FjdGlvbkxvZ0VudHJ5Lm9wZXJhdGlvbiA9PT0gXCJSRVNFUlZFXCIgJiZcbiAgICBsYXN0VHJhbnNhY3Rpb25Mb2dFbnRyeS5vcGVyYXRpb25TdWNjZXNzXG4gICkge1xuICAgIHJlZGlyZWN0VG8gPSBvblN1Y2Nlc3NVUkw7XG5cbiAgICAvKipcbiAgICAgKiBBdCB0aGlzIHBvaW50IHdlIGhhdmUgdXNlciBkZXRhaWxzIGZyb20gVmlwcHMsIHdoaWNoXG4gICAgICogbWFrZXMgaXQgYSBnb29kIHRpbWUgdG8gdXBkYXRlIHRoZSBDcnlzdGFsbGl6ZSBvcmRlclxuICAgICAqL1xuICAgIGNvbnN0IHtcbiAgICAgIHVzZXJEZXRhaWxzOiB7XG4gICAgICAgIHVzZXJJZCxcbiAgICAgICAgZmlyc3ROYW1lLFxuICAgICAgICBsYXN0TmFtZSxcbiAgICAgICAgZW1haWwsXG4gICAgICAgIG1vYmlsZU51bWJlcjogcGhvbmUsXG4gICAgICB9ID0ge30sXG4gICAgICBzaGlwcGluZ0RldGFpbHM6IHtcbiAgICAgICAgYWRkcmVzczoge1xuICAgICAgICAgIGFkZHJlc3NMaW5lMTogc3RyZWV0LFxuICAgICAgICAgIGFkZHJlc3NMaW5lMjogc3RyZWV0MixcbiAgICAgICAgICBwb3N0Q29kZTogcG9zdGFsQ29kZSxcbiAgICAgICAgICBjaXR5LFxuICAgICAgICAgIGNvdW50cnksXG4gICAgICAgIH0gPSB7fSxcbiAgICAgIH0gPSB7fSxcbiAgICB9ID0gb3JkZXI7XG5cbiAgICBhd2FpdCBjcnlzdGFsbGl6ZS5vcmRlcnMudXBkYXRlKGNyeXN0YWxsaXplT3JkZXJJZCwge1xuICAgICAgcGF5bWVudDogW1xuICAgICAgICB7XG4gICAgICAgICAgcHJvdmlkZXI6IFwiY3VzdG9tXCIsXG4gICAgICAgICAgY3VzdG9tOiB7XG4gICAgICAgICAgICBwcm9wZXJ0aWVzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eTogXCJQYXltZW50UHJvdmlkZXJcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogXCJWaXBwc1wiLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgcHJvcGVydHk6IFwiVmlwcHMgb3JkZXJJZFwiLFxuICAgICAgICAgICAgICAgIHZhbHVlOiBjcnlzdGFsbGl6ZU9yZGVySWQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBwcm9wZXJ0eTogXCJWaXBwcyB1c2VySWRcIixcbiAgICAgICAgICAgICAgICB2YWx1ZTogdXNlcklkLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIGN1c3RvbWVyOiB7XG4gICAgICAgIGlkZW50aWZpZXI6IGVtYWlsLFxuICAgICAgICBmaXJzdE5hbWUsXG4gICAgICAgIGxhc3ROYW1lLFxuICAgICAgICBhZGRyZXNzZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB0eXBlOiBcImRlbGl2ZXJ5XCIsXG4gICAgICAgICAgICBlbWFpbCxcbiAgICAgICAgICAgIGZpcnN0TmFtZSxcbiAgICAgICAgICAgIGxhc3ROYW1lLFxuICAgICAgICAgICAgcGhvbmUsXG4gICAgICAgICAgICBzdHJlZXQsXG4gICAgICAgICAgICBzdHJlZXQyLFxuICAgICAgICAgICAgcG9zdGFsQ29kZSxcbiAgICAgICAgICAgIGNpdHksXG4gICAgICAgICAgICBjb3VudHJ5LFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9IGVsc2Uge1xuICAgIHJlZGlyZWN0VG8gPSBvbkVycm9yVVJMO1xuICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGxhc3RUcmFuc2FjdGlvbkxvZ0VudHJ5LCBudWxsLCAyKSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHJlZGlyZWN0VG8sXG4gIH07XG59O1xuIiwiLyoqXG4gKiBWaXBwcyAoaHR0cHM6Ly92aXBwcy5ubylcbiAqXG4gKiBHZXR0aW5nIHN0YXJ0ZWQ6XG4gKiBodHRwczovL2NyeXN0YWxsaXplLmNvbS9sZWFybi9vcGVuLXNvdXJjZS9wYXltZW50LWdhdGV3YXlzL3ZpcHBzXG4gKi9cblxuY29uc3QgVklQUFNfQ0xJRU5UX0lEID0gcHJvY2Vzcy5lbnYuVklQUFNfQ0xJRU5UX0lEO1xuY29uc3QgVklQUFNfQ0xJRU5UX1NFQ1JFVCA9IHByb2Nlc3MuZW52LlZJUFBTX0NMSUVOVF9TRUNSRVQ7XG5jb25zdCBWSVBQU19NRVJDSEFOVF9TRVJJQUwgPSBwcm9jZXNzLmVudi5WSVBQU19NRVJDSEFOVF9TRVJJQUw7XG5jb25zdCBWSVBQU19TVUJfS0VZID0gcHJvY2Vzcy5lbnYuVklQUFNfU1VCX0tFWTtcblxuY29uc3QgaW5pdGlhdGVQYXltZW50ID0gcmVxdWlyZShcIi4vaW5pdGlhdGUtcGF5bWVudFwiKTtcbmNvbnN0IGZhbGxiYWNrID0gcmVxdWlyZShcIi4vZmFsbGJhY2tcIik7XG5jb25zdCBvcmRlclVwZGF0ZSA9IHJlcXVpcmUoXCIuL29yZGVyLXVwZGF0ZVwiKTtcbmNvbnN0IHVzZXJDb25zZW50UmVtb3ZhbCA9IHJlcXVpcmUoXCIuL3VzZXItY29uc2VudC1yZW1vdmFsXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZW5hYmxlZDogQm9vbGVhbihcbiAgICBWSVBQU19DTElFTlRfSUQgJiZcbiAgICAgIFZJUFBTX0NMSUVOVF9TRUNSRVQgJiZcbiAgICAgIFZJUFBTX01FUkNIQU5UX1NFUklBTCAmJlxuICAgICAgVklQUFNfU1VCX0tFWVxuICApLFxuICBmcm9udGVuZENvbmZpZzoge30sXG4gIGluaXRpYXRlUGF5bWVudCxcbiAgZmFsbGJhY2ssXG4gIG9yZGVyVXBkYXRlLFxuICB1c2VyQ29uc2VudFJlbW92YWwsXG59O1xuIiwiY29uc3QgaW52YXJpYW50ID0gcmVxdWlyZShcImludmFyaWFudFwiKTtcblxuY29uc3QgVklQUFNfTUVSQ0hBTlRfU0VSSUFMID0gcHJvY2Vzcy5lbnYuVklQUFNfTUVSQ0hBTlRfU0VSSUFMO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIGluaXRpYXRlVmlwcHNQYXltZW50KHtcbiAgY2hlY2tvdXRNb2RlbCxcbiAgY29udGV4dCxcbn0pIHtcbiAgY29uc3QgYmFza2V0U2VydmljZSA9IHJlcXVpcmUoXCIuLi8uLi9iYXNrZXQtc2VydmljZVwiKTtcbiAgY29uc3QgY3J5c3RhbGxpemUgPSByZXF1aXJlKFwiLi4vLi4vY3J5c3RhbGxpemVcIik7XG5cbiAgY29uc3QgeyBnZXRDbGllbnQgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuXG4gIGludmFyaWFudChcbiAgICBWSVBQU19NRVJDSEFOVF9TRVJJQUwsXG4gICAgXCJwcm9jZXNzLmVudi5WSVBQU19NRVJDSEFOVF9TRVJJQUwgaXMgdW5kZWZpbmVkXCJcbiAgKTtcblxuICBjb25zdCB7IGJhc2tldE1vZGVsLCBjdXN0b21lciwgY29uZmlybWF0aW9uVVJMLCBjaGVja291dFVSTCB9ID0gY2hlY2tvdXRNb2RlbDtcbiAgY29uc3QgeyBzZXJ2aWNlQ2FsbGJhY2tIb3N0LCB1c2VyIH0gPSBjb250ZXh0O1xuXG4gIC8vIEFkZCB0aGUgaWRlbnRpZmllciBmcm9tIHRoZSBjdXJyZW50IGxvZ2dlZCBpbiB1c2VyXG4gIGNvbnN0IGN1c3RvbWVyV2l0aEN1cnJlbnRMb2dnZWRJblVzZXIgPSB7XG4gICAgLi4uY3VzdG9tZXIsXG4gIH07XG4gIGlmICh1c2VyKSB7XG4gICAgY3VzdG9tZXJXaXRoQ3VycmVudExvZ2dlZEluVXNlci5pZGVudGlmaWVyID0gdXNlci5lbWFpbDtcbiAgfVxuXG4gIGNvbnN0IGJhc2tldCA9IGF3YWl0IGJhc2tldFNlcnZpY2UuZ2V0KHsgYmFza2V0TW9kZWwsIGNvbnRleHQgfSk7XG4gIGNvbnN0IHsgdG90YWwgfSA9IGJhc2tldDtcblxuICAvKiBVc2UgYSBDcnlzdGFsbGl6ZSBvcmRlciBhbmQgdGhlIGZ1bGZpbG1lbnQgcGlwZWxpbmVzIHRvXG4gICAqIG1hbmFnZSB0aGUgbGlmZWN5Y2xlIG9mIHRoZSBvcmRlclxuICAgKi9cbiAgY29uc3QgY3J5c3RhbGxpemVPcmRlciA9IGF3YWl0IGNyeXN0YWxsaXplLm9yZGVycy5jcmVhdGUoe1xuICAgIC4uLmJhc2tldCxcbiAgICBjdXN0b21lcjogY3VzdG9tZXJXaXRoQ3VycmVudExvZ2dlZEluVXNlcixcbiAgfSk7XG4gIGNvbnN0IGNyeXN0YWxsaXplT3JkZXJJZCA9IGNyeXN0YWxsaXplT3JkZXIuaWQ7XG5cbiAgLyoqXG4gICAqIFRoZSBWaXBwcyBcImZhbGxiYWNrXCIgdXJsLCBpcyB3aGVyZSB0aGUgdXNlciB3aWxsIGJlIHJlZGlyZWN0ZWRcbiAgICogdG8gYWZ0ZXIgY29tcGxldGluZyB0aGUgVmlwcHMgY2hlY2tvdXQuXG4gICAqL1xuICBjb25zdCBmYWxsQmFja1VSTCA9IG5ldyBVUkwoXG4gICAgYCR7c2VydmljZUNhbGxiYWNrSG9zdH0vd2ViaG9va3MvcGF5bWVudC1wcm92aWRlcnMvdmlwcHMvZmFsbGJhY2svJHtjcnlzdGFsbGl6ZU9yZGVySWR9YFxuICApO1xuICBmYWxsQmFja1VSTC5zZWFyY2hQYXJhbXMuYXBwZW5kKFxuICAgIFwiY29uZmlybWF0aW9uXCIsXG4gICAgZW5jb2RlVVJJQ29tcG9uZW50KFxuICAgICAgY29uZmlybWF0aW9uVVJMLnJlcGxhY2UoXCJ7Y3J5c3RhbGxpemVPcmRlcklkfVwiLCBjcnlzdGFsbGl6ZU9yZGVySWQpXG4gICAgKVxuICApO1xuICBmYWxsQmFja1VSTC5zZWFyY2hQYXJhbXMuYXBwZW5kKFwiY2hlY2tvdXRcIiwgZW5jb2RlVVJJQ29tcG9uZW50KGNoZWNrb3V0VVJMKSk7XG5cbiAgY29uc3QgdmlwcHNDbGllbnQgPSBhd2FpdCBnZXRDbGllbnQoKTtcblxuICBjb25zdCB2aXBwc1Jlc3BvbnNlID0gYXdhaXQgdmlwcHNDbGllbnQuaW5pdGlhdGVQYXltZW50KHtcbiAgICBvcmRlcjoge1xuICAgICAgbWVyY2hhbnRJbmZvOiB7XG4gICAgICAgIG1lcmNoYW50U2VyaWFsTnVtYmVyOiBWSVBQU19NRVJDSEFOVF9TRVJJQUwsXG4gICAgICAgIGZhbGxCYWNrOiBmYWxsQmFja1VSTC50b1N0cmluZygpLFxuICAgICAgICBjYWxsYmFja1ByZWZpeDogYCR7c2VydmljZUNhbGxiYWNrSG9zdH0vd2ViaG9va3MvcGF5bWVudC1wcm92aWRlcnMvdmlwcHMvb3JkZXItdXBkYXRlYCxcbiAgICAgICAgc2hpcHBpbmdEZXRhaWxzUHJlZml4OiBgJHtzZXJ2aWNlQ2FsbGJhY2tIb3N0fS93ZWJob29rcy9wYXltZW50LXByb3ZpZGVycy92aXBwcy9zaGlwcGluZ2AsXG4gICAgICAgIGNvbnNlbnRSZW1vdmFsUHJlZml4OiBgJHtzZXJ2aWNlQ2FsbGJhY2tIb3N0fS93ZWJob29rcy9wYXltZW50LXByb3ZpZGVycy92aXBwcy9jb25zdGVudC1yZW1vdmFsYCxcbiAgICAgICAgcGF5bWVudFR5cGU6IFwiZUNvbW0gRXhwcmVzcyBQYXltZW50XCIsXG4gICAgICAgIGlzQXBwOiBmYWxzZSxcbiAgICAgICAgc3RhdGljU2hpcHBpbmdEZXRhaWxzOiBbXG4gICAgICAgICAgLy8gUHJvdmlkZSBhIGRlZmF1bHQgc2hpcHBpbmcgbWV0aG9kXG4gICAgICAgICAge1xuICAgICAgICAgICAgaXNEZWZhdWx0OiBcIllcIixcbiAgICAgICAgICAgIHByaW9yaXR5OiAwLFxuICAgICAgICAgICAgc2hpcHBpbmdDb3N0OiAwLFxuICAgICAgICAgICAgc2hpcHBpbmdNZXRob2Q6IFwiUG9zdGVuIFNlcnZpY2VwYWtrZVwiLFxuICAgICAgICAgICAgc2hpcHBpbmdNZXRob2RJZDogXCJwb3N0ZW4tc2VydmljZXBha2tlXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICBjdXN0b21lckluZm86IHt9LFxuICAgICAgdHJhbnNhY3Rpb246IHtcbiAgICAgICAgb3JkZXJJZDogY3J5c3RhbGxpemVPcmRlcklkLFxuICAgICAgICBhbW91bnQ6IHBhcnNlSW50KHRvdGFsLmdyb3NzICogMTAwLCAxMCksXG4gICAgICAgIHRyYW5zYWN0aW9uVGV4dDogXCJDcnlzdGFsbGl6ZSB0ZXN0IHRyYW5zYWN0aW9uXCIsXG4gICAgICB9LFxuICAgIH0sXG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgc3VjY2VzczogdHJ1ZSxcbiAgICBjaGVja291dExpbms6IHZpcHBzUmVzcG9uc2UudXJsLFxuICAgIGNyeXN0YWxsaXplT3JkZXJJZCxcbiAgfTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IGFzeW5jIGZ1bmN0aW9uIHZpcHBzT3JkZXJVcGRhdGUoeyBjcnlzdGFsbGl6ZU9yZGVySWQgfSkge1xuICBjb25zb2xlLmxvZyhcIlZJUFBTIG9yZGVyIHVwZGF0ZVwiKTtcbiAgY29uc29sZS5sb2coeyBjcnlzdGFsbGl6ZU9yZGVySWQgfSk7XG5cbiAgLy8gY29uc3QgeyBnZXRDbGllbnQgfSA9IHJlcXVpcmUoXCIuL3V0aWxzXCIpO1xuICAvLyBjb25zdCB2aXBwc0NsaWVudCA9IGF3YWl0IGdldENsaWVudCgpO1xuXG4gIC8vIFJldHJpZXZlIHRoZSBWaXBwcyBvcmRlciB0cmFuc2FjdGlvbiBkZXRhaWxzXG4gIC8vIGNvbnN0IG9yZGVyID0gYXdhaXQgdmlwcHNDbGllbnQuZ2V0T3JkZXJEZXRhaWxzKHtcbiAgLy8gICBvcmRlcklkOiBjcnlzdGFsbGl6ZU9yZGVySWQsXG4gIC8vIH0pO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gdmlwcHNVc2VyQ29uc2VudFJlbW92YWwoeyB2aXBwc1VzZXJJZCB9KSB7XG4gIC8vIGNvbnN0IHsgZ2V0Q2xpZW50IH0gPSByZXF1aXJlKFwiLi91dGlsc1wiKTtcbiAgLy8gY29uc3QgdmlwcHNDbGllbnQgPSBhd2FpdCBnZXRDbGllbnQoKTtcblxuICBjb25zb2xlLmxvZyhcIlZJUFBTIHVzZXIgY29uc2VudCByZW1vdmFsXCIpO1xuICBjb25zb2xlLmxvZyh7IHZpcHBzVXNlcklkIH0pO1xufTtcbiIsImNvbnN0IGludmFyaWFudCA9IHJlcXVpcmUoXCJpbnZhcmlhbnRcIik7XG5cbmNvbnN0IFZJUFBTX0NMSUVOVF9JRCA9IHByb2Nlc3MuZW52LlZJUFBTX0NMSUVOVF9JRDtcbmNvbnN0IFZJUFBTX0NMSUVOVF9TRUNSRVQgPSBwcm9jZXNzLmVudi5WSVBQU19DTElFTlRfU0VDUkVUO1xuY29uc3QgVklQUFNfU1VCX0tFWSA9IHByb2Nlc3MuZW52LlZJUFBTX1NVQl9LRVk7XG5cbmxldCBjbGllbnQ7XG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZ2V0Q2xpZW50OiAoKSA9PiB7XG4gICAgaW52YXJpYW50KFZJUFBTX0NMSUVOVF9JRCwgXCJwcm9jZXNzLmVudi5WSVBQU19DTElFTlRfSUQgaXMgbm90IGRlZmluZWRcIik7XG4gICAgaW52YXJpYW50KFxuICAgICAgVklQUFNfQ0xJRU5UX1NFQ1JFVCxcbiAgICAgIFwicHJvY2Vzcy5lbnYuVklQUFNfQ0xJRU5UX1NFQ1JFVCBpcyBub3QgZGVmaW5lZFwiXG4gICAgKTtcbiAgICBpbnZhcmlhbnQoVklQUFNfU1VCX0tFWSwgXCJwcm9jZXNzLmVudi5WSVBQU19TVUJfS0VZIGlzIG5vdCBkZWZpbmVkXCIpO1xuXG4gICAgaWYgKCFjbGllbnQpIHtcbiAgICAgIGNvbnN0IFZpcHBzQ2xpZW50ID0gcmVxdWlyZShcIkBjcnlzdGFsbGl6ZS9ub2RlLXZpcHBzXCIpO1xuICAgICAgY2xpZW50ID0gbmV3IFZpcHBzQ2xpZW50KHtcbiAgICAgICAgdGVzdERyaXZlOiB0cnVlLFxuICAgICAgICBpZDogVklQUFNfQ0xJRU5UX0lELFxuICAgICAgICBzZWNyZXQ6IFZJUFBTX0NMSUVOVF9TRUNSRVQsXG4gICAgICAgIHN1YnNjcmlwdGlvbklkOiBWSVBQU19TVUJfS0VZLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNsaWVudDtcbiAgfSxcbn07XG4iLCJjb25zdCBpbnZhcmlhbnQgPSByZXF1aXJlKFwiaW52YXJpYW50XCIpO1xuXG5jb25zdCBjcnlzdGFsbGl6ZSA9IHJlcXVpcmUoXCIuLi9jcnlzdGFsbGl6ZVwiKTtcblxuLyoqXG4gKiBUb2RvOiBsaW5rIHRvIGdvb2QgSldUIGludHJvXG4gKi9cbmNvbnN0IEpXVF9TRUNSRVQgPSBwcm9jZXNzLmVudi5KV1RfU0VDUkVUO1xuXG4vLyBDb29raWUgY29uZmlnIGZvciB1c2VyIEpXVHNcbmNvbnN0IENPT0tJRV9VU0VSX1RPS0VOX05BTUUgPSBcInVzZXItdG9rZW5cIjtcbmNvbnN0IENPT0tJRV9VU0VSX1RPS0VOX01BWF9BR0UgPSA2MCAqIDYwICogMjQ7XG5jb25zdCBDT09LSUVfUkVGUkVTSF9UT0tFTl9OQU1FID0gXCJ1c2VyLXRva2VuLXJlZnJlc2hcIjtcbmNvbnN0IENPT0tJRV9SRUZSRVNIX1RPS0VOX01BWF9BR0UgPSA2MCAqIDYwICogMjQgKiA3O1xuXG5hc3luYyBmdW5jdGlvbiBnZXRVc2VyKHsgY29udGV4dCB9KSB7XG4gIGNvbnN0IHVzZXJJbkNvbnRleHQgPSBjb250ZXh0LnVzZXI7XG5cbiAgY29uc3QgdXNlciA9IHtcbiAgICBpc0xvZ2dlZEluOiBCb29sZWFuKHVzZXJJbkNvbnRleHQgJiYgXCJlbWFpbFwiIGluIHVzZXJJbkNvbnRleHQpLFxuICAgIGVtYWlsOiB1c2VySW5Db250ZXh0ICYmIHVzZXJJbkNvbnRleHQuZW1haWwsXG4gICAgbG9nb3V0TGluazogYCR7Y29udGV4dC5wdWJsaWNIb3N0fS91c2VyL2xvZ291dGAsXG4gIH07XG5cbiAgaWYgKHVzZXIgJiYgdXNlci5pc0xvZ2dlZEluKSB7XG4gICAgY29uc3QgY3J5c3RhbGxpemVDdXN0b21lciA9IGF3YWl0IGNyeXN0YWxsaXplLmN1c3RvbWVycy5nZXQoe1xuICAgICAgaWRlbnRpZmllcjogdXNlci5lbWFpbCxcbiAgICB9KTtcbiAgICBpZiAoY3J5c3RhbGxpemVDdXN0b21lcikge1xuICAgICAgT2JqZWN0LmFzc2lnbih1c2VyLCBjcnlzdGFsbGl6ZUN1c3RvbWVyKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdXNlcjtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIENPT0tJRV9VU0VSX1RPS0VOX05BTUUsXG4gIENPT0tJRV9SRUZSRVNIX1RPS0VOX05BTUUsXG4gIENPT0tJRV9VU0VSX1RPS0VOX01BWF9BR0UsXG4gIENPT0tJRV9SRUZSRVNIX1RPS0VOX01BWF9BR0UsXG4gIGF1dGhlbnRpY2F0ZSh0b2tlbikge1xuICAgIGludmFyaWFudChKV1RfU0VDUkVULCBcInByb2Nlc3MuZW52LkpXVF9TRUNSRVQgaXMgbm90IGRlZmluZWRcIik7XG5cbiAgICBpZiAoIXRva2VuKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgand0ID0gcmVxdWlyZShcImpzb253ZWJ0b2tlblwiKTtcbiAgICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHRva2VuLCBKV1RfU0VDUkVUKTtcbiAgICAgIGlmICghZGVjb2RlZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgZW1haWw6IGRlY29kZWQuZW1haWwsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfSxcbiAgYXN5bmMgc2VuZE1hZ2ljTGluayh7IGVtYWlsLCByZWRpcmVjdFVSTEFmdGVyTG9naW4sIGNvbnRleHQgfSkge1xuICAgIGludmFyaWFudChKV1RfU0VDUkVULCBcInByb2Nlc3MuZW52LkpXVF9TRUNSRVQgaXMgbm90IGRlZmluZWRcIik7XG5cbiAgICBjb25zdCB7IHB1YmxpY0hvc3QgfSA9IGNvbnRleHQ7XG5cbiAgICBjb25zdCBjcnlzdGFsbGl6ZUN1c3RvbWVyID0gYXdhaXQgY3J5c3RhbGxpemUuY3VzdG9tZXJzLmdldCh7XG4gICAgICBpZGVudGlmaWVyOiBlbWFpbCxcbiAgICB9KTtcblxuICAgIC8qKlxuICAgICAqIElmIHRoZXJlIGlzIG5vIGN1c3RvbWVyIHJlY29yZCBpbiBDcnlzdGFsbGl6ZSwgd2Ugd2lsbFxuICAgICAqIGNyZWF0ZSBvbmUuXG4gICAgICpcbiAgICAgKiBZb3UgY2FuIGNob29zZSBOT1QgdG8gY3JlYXRlIGEgY3VzdG9tZXIgYXQgdGhpcyBwb2ludCxcbiAgICAgKiBhbmQgcHJvaGliaXQgbG9naW5zIGZvciBub25lIGN1c3RvbWVyc1xuICAgICAqL1xuICAgIGlmICghY3J5c3RhbGxpemVDdXN0b21lcikge1xuICAgICAgLy8gcmV0dXJuIHtcbiAgICAgIC8vICAgc3VjY2VzczogZmFsc2UsXG4gICAgICAvLyAgIGVycm9yOiBcIkNVU1RPTUVSX05PVF9GT1VORFwiLFxuICAgICAgLy8gfTtcbiAgICAgIGNvbnN0IGVtYWlsUGFydHMgPSBlbWFpbC5zcGxpdChcIkBcIik7XG4gICAgICBhd2FpdCBjcnlzdGFsbGl6ZS5jdXN0b21lcnMuY3JlYXRlKHtcbiAgICAgICAgaWRlbnRpZmllcjogZW1haWwsXG4gICAgICAgIGZpcnN0TmFtZTogZW1haWxQYXJ0c1swXSxcbiAgICAgICAgbGFzdE5hbWU6IGVtYWlsUGFydHNbMV0sXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGlzIHRoZSBwYWdlIHJlc3BvbnNpYmxlIG9mIHJlY2VpdmluZyB0aGUgbWFnaWNcbiAgICAgKiBsaW5rIHRva2VuLCBhbmQgdGhlbiBjYWxsaW5nIHRoZSB2YWxpZGF0ZU1hZ2ljTGlua1Rva2VuXG4gICAgICogZnVuY3Rpb24gZnJvbSB1c2VyU2VydmljZS5cbiAgICAgKi9cbiAgICBjb25zdCBsb2dpbkxpbmsgPSBuZXcgVVJMKGAke3B1YmxpY0hvc3R9L3VzZXIvbG9naW4tbWFnaWMtbGlua2ApO1xuXG4gICAgLyoqXG4gICAgICogQWRkIHRoZSBKV1QgdG8gdGhlIGNhbGxiYWNrIHVybFxuICAgICAqIFdoZW4gdGhlIGxpbmsgaXMgdmlzaXRlZCwgd2UgY2FuIHZhbGlkYXRlIHRoZSB0b2tlblxuICAgICAqIGFnYWluIGluIHRoZSB2YWxpZGF0ZU1hZ2ljTGlua1Rva2VuIG1ldGhvZFxuICAgICAqL1xuICAgIGNvbnN0IGp3dCA9IHJlcXVpcmUoXCJqc29ud2VidG9rZW5cIik7XG4gICAgbG9naW5MaW5rLnNlYXJjaFBhcmFtcy5hcHBlbmQoXG4gICAgICBcInRva2VuXCIsXG4gICAgICBqd3Quc2lnbih7IGVtYWlsLCByZWRpcmVjdFVSTEFmdGVyTG9naW4gfSwgSldUX1NFQ1JFVCwge1xuICAgICAgICBleHBpcmVzSW46IFwiMWhcIixcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIGNvbnN0IGVtYWlsU2VydmljZSA9IHJlcXVpcmUoXCIuLi9lbWFpbC1zZXJ2aWNlXCIpO1xuXG4gICAgY29uc3QgeyBzdWNjZXNzIH0gPSBhd2FpdCBlbWFpbFNlcnZpY2Uuc2VuZFVzZXJNYWdpY0xpbmsoe1xuICAgICAgbG9naW5MaW5rOiBsb2dpbkxpbmsudG9TdHJpbmcoKSxcbiAgICAgIGVtYWlsLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHsgc3VjY2VzcyB9O1xuICB9LFxuICB2YWxpZGF0ZU1hZ2ljTGlua1Rva2VuKHRva2VuKSB7XG4gICAgaW52YXJpYW50KEpXVF9TRUNSRVQsIFwicHJvY2Vzcy5lbnYuSldUX1NFQ1JFVCBpcyBub3QgZGVmaW5lZFwiKTtcblxuICAgIC8qKlxuICAgICAqIEhlcmUgd2Ugd291bGQgd2FudCB0byBmZXRjaCBhbiBlbnRyeSBtYXRjaGluZyB0aGUgcHJvdmlkZWQgdG9rZW4gZnJvbSBvdXJcbiAgICAgKiBkYXRhc3RvcmUuIFRoaXMgYm9pbGVycGxhdGUgZG9lcyBub3QgaGF2ZSBhIGRhdGFzdG9yZSBjb25uZWN0ZWQgdG8gaXQgeWV0XG4gICAgICogc28gd2Ugd2lsbCBqdXN0IGFzc3VtZSB0aGUgdG9rZW4gaXMgZm9yIGEgcmVhbCB1c2VyIGFuZCBzaWduIGEgbG9naW4gdG9rZW5cbiAgICAgKiBhY2NvcmRpbmdseS5cbiAgICAgKi9cblxuICAgIHRyeSB7XG4gICAgICBjb25zdCBqd3QgPSByZXF1aXJlKFwianNvbndlYnRva2VuXCIpO1xuICAgICAgY29uc3QgZGVjb2RlZCA9IGp3dC52ZXJpZnkodG9rZW4sIEpXVF9TRUNSRVQpO1xuICAgICAgY29uc3QgeyBlbWFpbCwgcmVkaXJlY3RVUkxBZnRlckxvZ2luIH0gPSBkZWNvZGVkO1xuXG4gICAgICBjb25zdCBzaWduZWRMb2dpblRva2VuID0gand0LnNpZ24oeyBlbWFpbCB9LCBKV1RfU0VDUkVULCB7XG4gICAgICAgIGV4cGlyZXNJbjogQ09PS0lFX1VTRVJfVE9LRU5fTUFYX0FHRSxcbiAgICAgIH0pO1xuICAgICAgY29uc3Qgc2lnbmVkTG9naW5SZWZyZXNoVG9rZW4gPSBqd3Quc2lnbih7IGVtYWlsIH0sIEpXVF9TRUNSRVQsIHtcbiAgICAgICAgZXhwaXJlc0luOiBDT09LSUVfUkVGUkVTSF9UT0tFTl9NQVhfQUdFLFxuICAgICAgfSk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN1Y2Nlc3M6IHRydWUsXG4gICAgICAgIHNpZ25lZExvZ2luVG9rZW4sXG4gICAgICAgIENPT0tJRV9VU0VSX1RPS0VOX01BWF9BR0UsXG4gICAgICAgIHNpZ25lZExvZ2luUmVmcmVzaFRva2VuLFxuICAgICAgICByZWRpcmVjdFVSTEFmdGVyTG9naW4sXG4gICAgICAgIENPT0tJRV9SRUZSRVNIX1RPS0VOX01BWF9BR0UsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmxvZyhlcnJvcik7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBzdWNjZXNzOiBmYWxzZSxcbiAgICAgICAgZXJyb3IsXG4gICAgICB9O1xuICAgIH1cbiAgfSxcbiAgdmFsaWRhdGVSZWZyZXNoVG9rZW4oeyByZWZyZXNoVG9rZW4sIGVtYWlsIH0pIHtcbiAgICBpZiAoIXJlZnJlc2hUb2tlbiB8fCAhZW1haWwpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgand0ID0gcmVxdWlyZShcImpzb253ZWJ0b2tlblwiKTtcbiAgICAgIGNvbnN0IGRlY29kZWQgPSBqd3QudmVyaWZ5KHJlZnJlc2hUb2tlbiwgSldUX1NFQ1JFVCk7XG4gICAgICBpZiAoZGVjb2RlZC5lbWFpbCA9PT0gZW1haWwpIHtcbiAgICAgICAgcmV0dXJuIGp3dC5zaWduKHsgZW1haWwgfSwgSldUX1NFQ1JFVCwge1xuICAgICAgICAgIGV4cGlyZXNJbjogQ09PS0lFX1VTRVJfVE9LRU5fTUFYX0FHRSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgY29uc29sZS5sb2coZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9LFxuICBnZXRVc2VyLFxuICBhc3luYyB1cGRhdGUoeyBjb250ZXh0LCBpbnB1dCB9KSB7XG4gICAgY29uc3QgeyB1c2VyIH0gPSBjb250ZXh0O1xuICAgIGlmICghdXNlcikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gdXNlciBmb3VuZCBpbiBjb250ZXh0XCIpO1xuICAgIH1cbiAgICBhd2FpdCBjcnlzdGFsbGl6ZS5jdXN0b21lcnMudXBkYXRlKHtcbiAgICAgIGlkZW50aWZpZXI6IHVzZXIuZW1haWwsXG4gICAgICBjdXN0b21lcjogaW5wdXQsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZ2V0VXNlcih7IGNvbnRleHQgfSk7XG4gIH0sXG59O1xuIiwiY29uc3QgeyBjYWxsQ2F0YWxvZ3VlQXBpIH0gPSByZXF1aXJlKFwiLi4vY3J5c3RhbGxpemUvdXRpbHNcIik7XG5cbi8qKlxuICogRXhhbXBsZSBvZiBob3cgdG8gdXNlIENyeXN0YWxsaXplIHRvIHN0b3JlIGFuZFxuICogbWFuYWdlIHZvdWNoZXJzLlxuICpcbiAqIEV4cGVjdGVkIGNhdGFsb2d1ZSBzdHJ1Y3R1cmU6XG4gKiBfdm91Y2hlcnNcbiAqICAtIHZvdWNoZXJfMVxuICogIC0gdm91Y2hlcl8yXG4gKiAgLSAuLi5cbiAqICAtIHZvdWNoZXJfblxuICpcbiAqIEVhY2ggdm91Y2hlciBpcyBiYXNlZCBvbiB0aGUgZm9sbG93aW5nIHNoYXBlXG4gKiBjb2RlIChzaW5nbGVMaW5lKVxuICogZGlzY291bnQgKGNob2ljZUNvbXBvbmVudClcbiAqICAtIHBlcmNlbnQgKG51bWVyaWMpXG4gKiAgLSBhbW91bnQgKG51bWVyaWMpXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gYXN5bmMgZnVuY3Rpb24gZ2V0Q3J5c3RhbGxpemVWb3VjaGVycygpIHtcbiAgY29uc3Qgdm91Y2hlcnNGcm9tQ3J5c3RhbGxpemUgPSBhd2FpdCBjYWxsQ2F0YWxvZ3VlQXBpKHtcbiAgICBxdWVyeTogYFxuICAgICAge1xuICAgICAgICBjYXRhbG9ndWUobGFuZ3VhZ2U6IFwiZW5cIiwgcGF0aDogXCIvdm91Y2hlcnNcIikge1xuICAgICAgICAgIGNoaWxkcmVuIHtcbiAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICAgIGNvZGU6IGNvbXBvbmVudChpZDogXCJjb2RlXCIpIHtcbiAgICAgICAgICAgICAgY29udGVudCB7XG4gICAgICAgICAgICAgICAgLi4uIG9uIFNpbmdsZUxpbmVDb250ZW50IHtcbiAgICAgICAgICAgICAgICAgIHRleHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRpc2NvdW50OiBjb21wb25lbnQoaWQ6IFwiZGlzY291bnRcIikge1xuICAgICAgICAgICAgICBjb250ZW50IHtcbiAgICAgICAgICAgICAgICAuLi4gb24gQ29tcG9uZW50Q2hvaWNlQ29udGVudCB7XG4gICAgICAgICAgICAgICAgICBzZWxlY3RlZENvbXBvbmVudCB7XG4gICAgICAgICAgICAgICAgICAgIGlkXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQge1xuICAgICAgICAgICAgICAgICAgICAgIC4uLiBvbiBOdW1lcmljQ29udGVudCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBgLFxuICB9KTtcblxuICBpZiAoXG4gICAgIXZvdWNoZXJzRnJvbUNyeXN0YWxsaXplLmRhdGEgfHxcbiAgICAhdm91Y2hlcnNGcm9tQ3J5c3RhbGxpemUuZGF0YS5jYXRhbG9ndWVcbiAgKSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgcmV0dXJuIHZvdWNoZXJzRnJvbUNyeXN0YWxsaXplLmRhdGEuY2F0YWxvZ3VlLmNoaWxkcmVuLm1hcChcbiAgICAodm91Y2hlckZyb21DcnlzdGFsbGl6ZSkgPT4ge1xuICAgICAgY29uc3QgZGlzY291bnRDb21wb25lbnQgPVxuICAgICAgICB2b3VjaGVyRnJvbUNyeXN0YWxsaXplLmRpc2NvdW50LmNvbnRlbnQuc2VsZWN0ZWRDb21wb25lbnQ7XG5cbiAgICAgIGxldCBkaXNjb3VudEFtb3VudCA9IG51bGw7XG4gICAgICBsZXQgZGlzY291bnRQZXJjZW50ID0gbnVsbDtcbiAgICAgIGlmIChkaXNjb3VudENvbXBvbmVudC5pZCA9PT0gXCJwZXJjZW50XCIpIHtcbiAgICAgICAgZGlzY291bnRQZXJjZW50ID0gZGlzY291bnRDb21wb25lbnQuY29udGVudC5udW1iZXI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkaXNjb3VudEFtb3VudCA9IGRpc2NvdW50Q29tcG9uZW50LmNvbnRlbnQubnVtYmVyO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBjb2RlOiB2b3VjaGVyRnJvbUNyeXN0YWxsaXplLmNvZGUuY29udGVudC50ZXh0LFxuICAgICAgICBkaXNjb3VudEFtb3VudCxcbiAgICAgICAgZGlzY291bnRQZXJjZW50LFxuICAgICAgICBvbmx5Rm9yQXV0aG9yaXNlZFVzZXI6IGZhbHNlLFxuICAgICAgfTtcbiAgICB9XG4gICk7XG59O1xuIiwiY29uc3QgZ2V0Q3J5c3RhbGxpemVWb3VjaGVycyA9IHJlcXVpcmUoXCIuL2NyeXN0YWxsaXplLXZvdWNoZXJzLWV4YW1wbGVcIik7XG5cbi8qKlxuICogRXhhbXBsZSBvZiBhIHZvdWNoZXIgcmVnaXN0ZXJcbiAqIFlvdSBjYW4gY3VzdG9taXNlIHRoaXMgdG8gY2FsbCBhbiBleHRlcm5hbCBzZXJ2aWNlXG4gKiBvciBrZWVwIHN0YXRpYyB2b3VjaGVycyBsaWtlIHRoaXNcbiAqL1xuY29uc3Qgdm91Y2hlclJlZ2lzdGVyID0gW1xuICB7XG4gICAgY29kZTogXCJvay1kZWFsXCIsXG4gICAgZGlzY291bnRBbW91bnQ6IDIsXG4gICAgZGlzY291bnRQZXJjZW50OiBudWxsLFxuICAgIG9ubHlGb3JBdXRob3Jpc2VkVXNlcjogZmFsc2UsXG4gIH0sXG4gIHtcbiAgICBjb2RlOiBcImZhaXItZGVhbFwiLFxuICAgIGRpc2NvdW50QW1vdW50OiBudWxsLFxuICAgIGRpc2NvdW50UGVyY2VudDogNSxcbiAgICBvbmx5Rm9yQXV0aG9yaXNlZFVzZXI6IGZhbHNlLFxuICB9LFxuICB7XG4gICAgY29kZTogXCJhd2Vzb21lLWRlYWwtbG9nZ2VkLWluXCIsXG4gICAgZGlzY291bnRBbW91bnQ6IG51bGwsXG4gICAgZGlzY291bnRQZXJjZW50OiAxMCxcbiAgICBvbmx5Rm9yQXV0aG9yaXNlZFVzZXI6IHRydWUsXG4gIH0sXG4gIHtcbiAgICBjb2RlOiBcImdvb2QtZGVhbC1sb2dnZWQtaW5cIixcbiAgICBkaXNjb3VudEFtb3VudDogMTAwLFxuICAgIGRpc2NvdW50UGVyY2VudDogbnVsbCxcbiAgICBvbmx5Rm9yQXV0aG9yaXNlZFVzZXI6IHRydWUsXG4gIH0sXG5dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYXN5bmMgZ2V0KHsgY29kZSwgY29udGV4dCB9KSB7XG4gICAgY29uc3QgeyB1c2VyIH0gPSBjb250ZXh0O1xuXG4gICAgY29uc3QgaXNBbm9ueW1vdXNVc2VyID0gIXVzZXIgfHwgIXVzZXIuaXNMb2dnZWRJbjtcblxuICAgIGNvbnN0IGFsbENyeXN0YWxsaXplVm91Y2hlcnMgPSBhd2FpdCBnZXRDcnlzdGFsbGl6ZVZvdWNoZXJzKCk7XG5cbiAgICBjb25zdCBhbGxWb3VjaGVycyA9IFsuLi52b3VjaGVyUmVnaXN0ZXIsIC4uLmFsbENyeXN0YWxsaXplVm91Y2hlcnNdO1xuXG4gICAgLy8gQXMgZGVmYXVsdCwgbm90IGFsbCB0aGUgdm91Y2hlcnMgd29yayBmb3IgYW5vbnltb3VzIHVzZXJzLlxuICAgIC8vIEFzIHlvdSdsbCBzZWUgaW4gdGhlIGNvbmZpZ3VyYXRpb24gYWJvdmUsIHNvbWUgbmVlZCB0aGUgdXNlciB0byBiZSBsb2dnZWQgaW5cbiAgICBpZiAoaXNBbm9ueW1vdXNVc2VyKSB7XG4gICAgICBjb25zdCB2b3VjaGVyID0gYWxsVm91Y2hlcnNcbiAgICAgICAgLmZpbHRlcigodikgPT4gIXYub25seUZvckF1dGhvcmlzZWRVc2VyKVxuICAgICAgICAuZmluZCgodikgPT4gdi5jb2RlID09PSBjb2RlKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaXNWYWxpZDogQm9vbGVhbih2b3VjaGVyKSxcbiAgICAgICAgdm91Y2hlcixcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gU2VhcmNoIGFsbCB2b3VjaGVycyBmb3IgYXV0aGVudGljYXRlZCB1c2Vyc1xuICAgIGxldCB2b3VjaGVyID0gYWxsVm91Y2hlcnMuZmluZCgodikgPT4gdi5jb2RlID09PSBjb2RlKTtcblxuICAgIHJldHVybiB7XG4gICAgICBpc1ZhbGlkOiBCb29sZWFuKHZvdWNoZXIpLFxuICAgICAgdm91Y2hlcixcbiAgICB9O1xuICB9LFxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIkBjcnlzdGFsbGl6ZS9ub2RlLWtsYXJuYVwiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJAY3J5c3RhbGxpemUvbm9kZS12aXBwc1wiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJAbW9sbGllL2FwaS1jbGllbnRcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiQHBheXBhbC9jaGVja291dC1zZXJ2ZXItc2RrXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIkBzZW5kZ3JpZC9tYWlsXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImFwb2xsby1zZXJ2ZXItbWljcm9cIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiZ3JhcGhxbC10YWdcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwiaW52YXJpYW50XCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcImpzb253ZWJ0b2tlblwiKTsiLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoXCJtam1sXCIpOyIsIm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZShcIm5vZGUtZmV0Y2hcIik7IiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKFwic3RyaXBlXCIpOyJdLCJuYW1lcyI6WyJhbGxvd0NvcnMiLCJmbiIsInJlcSIsInJlcyIsInNldEhlYWRlciIsImhlYWRlcnMiLCJvcmlnaW4iLCJtZXRob2QiLCJzdGF0dXMiLCJlbmQiLCJBcG9sbG9TZXJ2ZXIiLCJjb3JzIiwiY3JlYXRlR3JhcGhRTFNlcnZlckNvbmZpZyIsInVzZXJTZXJ2aWNlIiwiYXBvbGxvU2VydmVyIiwiYXBpUGF0aFByZWZpeCIsIm5vcm1hbGlzZVJlcXVlc3QiLCJyZWZyZXNoVXNlclRva2VuIiwibmV3VXNlclRva2VuIiwiQ09PS0lFX1VTRVJfVE9LRU5fTkFNRSIsIkNPT0tJRV9VU0VSX1RPS0VOX01BWF9BR0UiLCJjb25maWciLCJhcGkiLCJib2R5UGFyc2VyIiwiY3JlYXRlSGFuZGxlciIsInBhdGgiLCJyZXF1aXJlIiwiZ2V0SG9zdCIsIm1vZHVsZSIsImV4cG9ydHMiLCJjcmVhdGVDb250ZXh0IiwiY29udGV4dCIsImFyZ3MiLCJjb29raWVzIiwidXNlciIsImF1dGhlbnRpY2F0ZSIsInZhbGlkYXRlUmVmcmVzaFRva2VuIiwicmVmcmVzaFRva2VuIiwiQ09PS0lFX1JFRlJFU0hfVE9LRU5fTkFNRSIsImVtYWlsIiwicHVibGljSG9zdCIsInNlcnZpY2VDYWxsYmFja0hvc3QiLCJwcm9jZXNzIiwiZW52IiwiU0VSVklDRV9DQUxMQkFDS19IT1NUIiwiZW5kc1dpdGgiLCJyZXNvbHZlcnMiLCJ0eXBlRGVmcyIsImNyZWF0ZUdyYXBocWxTZXJ2ZXJDb25maWciLCJpbnRyb3NwZWN0aW9uIiwicGxheWdyb3VuZCIsImVuZHBvaW50Iiwic2V0dGluZ3MiLCJzdWJzY3JpcHRpb25zIiwiY3J5c3RhbGxpemUiLCJiYXNrZXRTZXJ2aWNlIiwidm91Y2hlclNlcnZpY2UiLCJzdHJpcGVTZXJ2aWNlIiwibW9sbGllU2VydmljZSIsInZpcHBzU2VydmljZSIsImtsYXJuYVNlcnZpY2UiLCJwYXlwYWxTZXJ2aWNlIiwiaW52b2ljZVNlcnZpY2UiLCJwYXltZW50UHJvdmlkZXJSZXNvbHZlciIsInNlcnZpY2UiLCJlbmFibGVkIiwiZnJvbnRlbmRDb25maWciLCJRdWVyeSIsIm15Q3VzdG9tQnVzaW5lc3NUaGluZyIsIndoYXRJc1RoaXMiLCJiYXNrZXQiLCJwYXJlbnQiLCJnZXQiLCJnZXRVc2VyIiwib3JkZXJzIiwicGF5bWVudFByb3ZpZGVycyIsInZvdWNoZXIiLCJNeUN1c3RvbUJ1c2lubmVzc1F1ZXJpZXMiLCJkeW5hbWljUmFuZG9tSW50IiwiY29uc29sZSIsImxvZyIsInBhcnNlSW50IiwiTWF0aCIsInJhbmRvbSIsIlBheW1lbnRQcm92aWRlcnNRdWVyaWVzIiwic3RyaXBlIiwia2xhcm5hIiwidmlwcHMiLCJtb2xsaWUiLCJwYXlwYWwiLCJpbnZvaWNlIiwiT3JkZXJRdWVyaWVzIiwiaWQiLCJNdXRhdGlvbiIsIlVzZXJNdXRhdGlvbnMiLCJzZW5kTWFnaWNMaW5rIiwidXBkYXRlIiwiUGF5bWVudFByb3ZpZGVyc011dGF0aW9ucyIsIlN0cmlwZU11dGF0aW9ucyIsImNyZWF0ZVBheW1lbnRJbnRlbnQiLCJjb25maXJtT3JkZXIiLCJLbGFybmFNdXRhdGlvbnMiLCJyZW5kZXJDaGVja291dCIsIk1vbGxpZU11dGF0aW9ucyIsImNyZWF0ZVBheW1lbnQiLCJWaXBwc011dGF0aW9ucyIsImluaXRpYXRlUGF5bWVudCIsIlBheXBhbE11dGF0aW9uIiwiY3JlYXRlUGF5cGFsUGF5bWVudCIsImNvbmZpcm1QYXltZW50IiwiY29uZmlybVBheXBhbFBheW1lbnQiLCJJbnZvaWNlTXV0YXRpb24iLCJjcmVhdGVJbnZvaWNlIiwiY3JlYXRlQ3J5c3RhbGxpemVPcmRlciIsImdxbCIsImZvcm1hdEN1cnJlbmN5IiwiYW1vdW50IiwiY3VycmVuY3kiLCJJbnRsIiwiTnVtYmVyRm9ybWF0Iiwic3R5bGUiLCJmb3JtYXQiLCJ4cHJvdG9jb2wiLCJ4aG9zdCIsIkhPU1RfVVJMIiwiSG9zdCIsImhvc3QiLCJzdGFydHNXaXRoIiwiVkVSQ0VMX1VSTCIsIkVycm9yIiwidHJ1bmNhdGVEZWNpbWFsc09mTnVtYmVyIiwib3JpZ2luYWxOdW1iZXIiLCJudW1iZXJPZkRlY2ltYWxzIiwiYW1vdW50VHJ1bmNhdGVkIiwidG9GaXhlZCIsInBhcnNlRmxvYXQiLCJjYWxjdWxhdGVWb3VjaGVyRGlzY291bnRBbW91bnQiLCJpc0Rpc2NvdW50QW1vdW50IiwiQm9vbGVhbiIsImRpc2NvdW50QW1vdW50IiwiYW1vdW50VG9EaXNjb3VudCIsImRpc2NvdW50UGVyY2VudCIsIlZBVE92ZXJyaWRlcyIsImxvY2FsZSIsInZhdFR5cGVzIiwibmFtZSIsInBlcmNlbnQiLCJnZXRQcm9kdWN0c0Zyb21DcnlzdGFsbGl6ZSIsInNrdXMiLCJsZW5ndGgiLCJsYW5ndWFnZSIsImNyeXN0YWxsaXplQ2F0YWxvZ3VlTGFuZ3VhZ2UiLCJjYWxsQ2F0YWxvZ3VlQXBpIiwiY2FsbFNlYXJjaEFwaSIsInBhdGhzU2V0IiwiU2V0Iiwic2VhcmNoQWZ0ZXJDdXJzb3IiLCJnZXROZXh0U2VhcmNoUGFnZSIsInNlYXJjaEFQSVJlc3BvbnNlIiwicXVlcnkiLCJ2YXJpYWJsZXMiLCJhZnRlciIsImVkZ2VzIiwicGFnZUluZm8iLCJkYXRhIiwic2VhcmNoIiwiZm9yRWFjaCIsImVkZ2UiLCJhZGQiLCJub2RlIiwiaGFzTmV4dFBhZ2UiLCJlbmRDdXJzb3IiLCJwYXRocyIsIkFycmF5IiwiZnJvbSIsInJlc3BvbnNlIiwibWFwIiwiaW5kZXgiLCJ2YXRUeXBlT3ZlcnJpZGVzRm9yTG9jYWxlIiwiZmluZCIsInYiLCJfIiwiaSIsImZpbHRlciIsInAiLCJkb1ZBVE92ZXJyaWRlIiwicHJvZHVjdCIsInZhdFR5cGVPdmVycmlkZSIsInZhdFR5cGUiLCJnZXRUb3RhbHMiLCJjYXJ0IiwicmVkdWNlIiwiYWNjIiwiY3VyciIsInF1YW50aXR5IiwicHJpY2UiLCJwcmljZVRvVXNlIiwiZGlzY291bnRlZCIsImdyb3NzIiwibmV0IiwidGF4IiwiZGlzY291bnQiLCJiYXNrZXRNb2RlbCIsInZvdWNoZXJDb2RlIiwiYmFza2V0RnJvbUNsaWVudCIsImNvZGUiLCJpc1ZhbGlkIiwicHJvZHVjdERhdGFGcm9tQ3J5c3RhbGxpemUiLCJza3UiLCJpdGVtRnJvbUNsaWVudCIsInZhcmlhbnRzIiwic29tZSIsInZhcmlhbnQiLCJwcmljZVZhcmlhbnRzIiwicHYiLCJpZGVudGlmaWVyIiwicHJpY2VWYXJpYW50SWRlbnRpZmllciIsInByb2R1Y3RJZCIsInByb2R1Y3RWYXJpYW50SWQiLCJ0b3RhbCIsImNhcnRXaXRoVm91Y2hlciIsImNhcnRJdGVtIiwicG9ydGlvbk9mVG90YWwiLCJwb3J0aW9uT2ZEaXNjb3VudCIsImNhbGxQaW1BcGkiLCJnZXRUZW5hbnRJZCIsImNyZWF0ZUN1c3RvbWVyIiwiY3VzdG9tZXIiLCJ0ZW5hbnRJZCIsImlucHV0IiwiY3JlYXRlIiwiZ2V0Q3VzdG9tZXIiLCJleHRlcm5hbFJlZmVyZW5jZSIsInVwZGF0ZUN1c3RvbWVyIiwicmVzdCIsImN1c3RvbWVycyIsImNhbGxPcmRlcnNBcGkiLCJub3JtYWxpc2VPcmRlck1vZGVsIiwiY3JlYXRlT3JkZXIiLCJnZXRPcmRlciIsIm9yZGVyIiwid2FpdEZvck9yZGVyVG9CZVBlcnNpc3RhdGVkIiwidXBkYXRlT3JkZXIiLCJyZXRyaWVzIiwibWF4UmV0cmllcyIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY2hlY2siLCJzZXRUaW1lb3V0IiwiaW52YXJpYW50IiwiZmV0Y2giLCJDUllTVEFMTElaRV9URU5BTlRfSURFTlRJRklFUiIsIkNSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9JRCIsIkNSWVNUQUxMSVpFX0FDQ0VTU19UT0tFTl9TRUNSRVQiLCJjcmVhdGVBcGlDYWxsZXIiLCJ1cmkiLCJjYWxsQXBpIiwib3BlcmF0aW9uTmFtZSIsImJvZHkiLCJKU09OIiwic3RyaW5naWZ5IiwianNvbiIsImVycm9ycyIsImhhbmRsZU9yZGVyQ2FydEl0ZW0iLCJpdGVtIiwiaW1hZ2VzIiwiaW1hZ2VVcmwiLCJ1cmwiLCJmaXJzdE5hbWUiLCJsYXN0TmFtZSIsImFkZHJlc3NlcyIsInR5cGUiLCJ1bmRlZmluZWQiLCJ0ZW5hbnRJZFJlc3BvbnNlIiwidGVuYW50Iiwic2VuZEVtYWlsIiwic2VuZE9yZGVyQ29uZmlybWF0aW9uIiwic2VuZFVzZXJNYWdpY0xpbmsiLCJvcmRlcklkIiwibWptbDJodG1sIiwic3VjY2VzcyIsImVycm9yIiwiaHRtbCIsInRvIiwic3ViamVjdCIsInNlbmRNYWdpY0xpbmtMb2dpbiIsImxvZ2luTGluayIsIlNFTkRHUklEX0FQSV9LRVkiLCJFTUFJTF9GUk9NIiwic2dNYWlsIiwic2V0QXBpS2V5Iiwic2VuZCIsImNoZWNrb3V0TW9kZWwiLCJjdXN0b21lcldpdGhDdXJyZW50TG9nZ2VkSW5Vc2VyIiwiY3J5c3RhbGxpemVPcmRlciIsImtsYXJuYUNhcHR1cmUiLCJjcnlzdGFsbGl6ZU9yZGVySWQiLCJnZXRDbGllbnQiLCJrbGFybmFQYXltZW50IiwicGF5bWVudCIsInByb3ZpZGVyIiwia2xhcm5hT3JkZXJJZCIsImtsYXJuYUNsaWVudCIsIm9yZGVybWFuYWdlbWVudFYxIiwiY2FwdHVyZXMiLCJjYXB0dXJlIiwiS0xBUk5BX1VTRVJOQU1FIiwiS0xBUk5BX1BBU1NXT1JEIiwicHVzaCIsImtsYXJuYVB1c2giLCJhY2tub3dsZWRnZSIsInRvS2xhcm5hT3JkZXJNb2RlbCIsImNvbmZpcm1hdGlvblVSTCIsInRlcm1zVVJMIiwiY2hlY2tvdXRVUkwiLCJjb25maXJtYXRpb24iLCJVUkwiLCJyZXBsYWNlIiwic2VhcmNoUGFyYW1zIiwiYXBwZW5kIiwidmFsaWRLbGFybmFPcmRlck1vZGVsIiwicHVyY2hhc2VfY291bnRyeSIsInB1cmNoYXNlX2N1cnJlbmN5IiwibWVyY2hhbnRfdXJscyIsInRlcm1zIiwiY2hlY2tvdXQiLCJ0b1N0cmluZyIsImNoZWNrb3V0VjMiLCJodG1sX3NuaXBwZXQiLCJvcmRlcl9pZCIsImNyeXN0YWxsaXplVG9LbGFybmFPcmRlck1vZGVsIiwib3JkZXJfYW1vdW50Iiwib3JkZXJfdGF4X2Ftb3VudCIsIm9yZGVyX2xpbmVzIiwidW5pdF9wcmljZSIsInJlZmVyZW5jZSIsInRvdGFsX2Ftb3VudCIsInRvdGFsX3RheF9hbW91bnQiLCJ0YXhfcmF0ZSIsImltYWdlX3VybCIsIm1lcmNoYW50X2RhdGEiLCJ0YXhHcm91cCIsImNsaWVudCIsIktsYXJuYSIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJhcGlFbmRwb2ludCIsImNyZWF0ZU1vbGxpZVBheW1lbnQiLCJpc1N1YnNjcmlwdGlvbiIsIm1ldGEiLCJrZXkiLCJ2YWx1ZSIsIm1vbGxpZUNsaWVudCIsIm1vbGxpZUN1c3RvbWVyIiwidHJpbSIsInZhbGlkTW9sbGllT3JkZXIiLCJNT0xMSUVfREVGQVVMVF9DVVJSRU5DWSIsInRvVXBwZXJDYXNlIiwiY3VzdG9tZXJJZCIsInNlcXVlbmNlVHlwZSIsImRlc2NyaXB0aW9uIiwicmVkaXJlY3RVcmwiLCJ3ZWJob29rVXJsIiwibWV0YWRhdGEiLCJtb2xsaWVPcmRlclJlc3BvbnNlIiwicGF5bWVudHMiLCJjdXN0b21lcnNfbWFuZGF0ZXMiLCJtYW5kYXRlSWQiLCJzdGFydERhdGUiLCJEYXRlIiwic2V0RGF0ZSIsImdldERhdGUiLCJ0b0lTT1N0cmluZyIsInNwbGl0IiwiY3VzdG9tZXJzX3N1YnNjcmlwdGlvbnMiLCJ0aW1lcyIsImludGVydmFsIiwiY2hlY2tvdXRMaW5rIiwiX2xpbmtzIiwiaHJlZiIsInRvQ3J5c3RhbGxpemVPcmRlck1vZGVsIiwiTU9MTElFX0FQSV9LRVkiLCJtb2xsaWVUb0NyeXN0YWxsaXplT3JkZXJNb2RlbCIsIm1vbGxpZU9yZGVyIiwiY3VzdG9tZXJOYW1lIiwibWlkZGxlTmFtZSIsInNsaWNlIiwiam9pbiIsImJpcnRoRGF0ZSIsInN0cmVldCIsInN0cmVldDIiLCJwb3N0YWxDb2RlIiwiY2l0eSIsInN0YXRlIiwiY291bnRyeSIsInBob25lIiwiY3VzdG9tIiwicHJvcGVydGllcyIsInByb3BlcnR5IiwicmVzb3VyY2UiLCJtb2RlIiwicHJvZmlsZUlkIiwiY3JlYXRlTW9sbGllQ2xpZW50IiwiYXBpS2V5IiwiY2hlY2tvdXROb2RlSnNzZGsiLCJQYXlwYWxDbGllbnQiLCJleGVjdXRlIiwiT3JkZXJzR2V0UmVxdWVzdCIsInJlc3VsdCIsImVyciIsInJlcXVlc3QiLCJPcmRlcnNDcmVhdGVSZXF1ZXN0IiwicHJlZmVyIiwicmVxdWVzdEJvZHkiLCJpbnRlbnQiLCJwdXJjaGFzZV91bml0cyIsImN1cnJlbmN5X2NvZGUiLCJQQVlQQUxfQ0xJRU5UX0lEIiwiUEFZUEFMX0NMSUVOVF9TRUNSRVQiLCJjbGllbnRJZCIsImNsaWVudFNlY3JldCIsImNsaWVudEVudiIsImNvcmUiLCJTYW5kYm94RW52aXJvbm1lbnQiLCJQYXlQYWxIdHRwQ2xpZW50IiwicGF5ZXIiLCJzaGlwcGluZyIsImFkZHJlc3MiLCJlbWFpbF9hZGRyZXNzIiwicGF5ZXJfaWQiLCJnaXZlbl9uYW1lIiwic3VybmFtZSIsImFkZHJlc3NfbGluZV8xIiwicG9zdGFsX2NvZGUiLCJhZG1pbl9hcmVhXzIiLCJhZG1pbl9hcmVhXzEiLCJjb3VudHJ5X2NvZGUiLCJwYXltZW50SW50ZW50SWQiLCJjcnlzdGFsbGl6ZU9yZGVyTW9kZWwiLCJjdXN0b21lcklkZW50aWZpZXIiLCJjb25maXJtIiwicGF5bWVudE1ldGhvZElkIiwicGF5bWVudEludGVudCIsInBheW1lbnRJbnRlbnRzIiwicGF5bWVudF9tZXRob2QiLCJTVFJJUEVfU0VDUkVUX0tFWSIsIlNUUklQRV9QVUJMSVNIQUJMRV9LRVkiLCJwdWJsaXNoYWJsZUtleSIsInN0cmlwZVRvQ3J5c3RhbGxpemVPcmRlck1vZGVsIiwicmV0cmlldmUiLCJjaGFyZ2VzIiwiY2hhcmdlIiwiYmlsbGluZ19kZXRhaWxzIiwicmVjZWlwdF9lbWFpbCIsImFkZHJlc3NXaXRoRW1haWwiLCJhIiwibGluZTEiLCJsaW5lMiIsInBheW1lbnRfaW50ZW50IiwicGF5bWVudE1ldGhvZCIsInBheW1lbnRfbWV0aG9kX2RldGFpbHMiLCJzdWJzY3JpcHRpb25JZCIsInN1YnNjcmlwdGlvbiIsInN0cmlwZVNkayIsInZpcHBzRmFsbGJhY2siLCJvblN1Y2Nlc3NVUkwiLCJvbkVycm9yVVJMIiwicmVkaXJlY3RUbyIsInZpcHBzQ2xpZW50IiwiZ2V0T3JkZXJEZXRhaWxzIiwibGFzdFRyYW5zYWN0aW9uTG9nRW50cnkiLCJ0cmFuc2FjdGlvbkxvZ0hpc3RvcnkiLCJzb3J0IiwiYiIsInRpbWVTdGFtcCIsIm9wZXJhdGlvbiIsIm9wZXJhdGlvblN1Y2Nlc3MiLCJ1c2VyRGV0YWlscyIsInVzZXJJZCIsIm1vYmlsZU51bWJlciIsInNoaXBwaW5nRGV0YWlscyIsImFkZHJlc3NMaW5lMSIsImFkZHJlc3NMaW5lMiIsInBvc3RDb2RlIiwiVklQUFNfQ0xJRU5UX0lEIiwiVklQUFNfQ0xJRU5UX1NFQ1JFVCIsIlZJUFBTX01FUkNIQU5UX1NFUklBTCIsIlZJUFBTX1NVQl9LRVkiLCJmYWxsYmFjayIsIm9yZGVyVXBkYXRlIiwidXNlckNvbnNlbnRSZW1vdmFsIiwiaW5pdGlhdGVWaXBwc1BheW1lbnQiLCJmYWxsQmFja1VSTCIsImVuY29kZVVSSUNvbXBvbmVudCIsInZpcHBzUmVzcG9uc2UiLCJtZXJjaGFudEluZm8iLCJtZXJjaGFudFNlcmlhbE51bWJlciIsImZhbGxCYWNrIiwiY2FsbGJhY2tQcmVmaXgiLCJzaGlwcGluZ0RldGFpbHNQcmVmaXgiLCJjb25zZW50UmVtb3ZhbFByZWZpeCIsInBheW1lbnRUeXBlIiwiaXNBcHAiLCJzdGF0aWNTaGlwcGluZ0RldGFpbHMiLCJpc0RlZmF1bHQiLCJwcmlvcml0eSIsInNoaXBwaW5nQ29zdCIsInNoaXBwaW5nTWV0aG9kIiwic2hpcHBpbmdNZXRob2RJZCIsImN1c3RvbWVySW5mbyIsInRyYW5zYWN0aW9uIiwidHJhbnNhY3Rpb25UZXh0IiwidmlwcHNPcmRlclVwZGF0ZSIsInZpcHBzVXNlckNvbnNlbnRSZW1vdmFsIiwidmlwcHNVc2VySWQiLCJWaXBwc0NsaWVudCIsInRlc3REcml2ZSIsInNlY3JldCIsIkpXVF9TRUNSRVQiLCJDT09LSUVfUkVGUkVTSF9UT0tFTl9NQVhfQUdFIiwidXNlckluQ29udGV4dCIsImlzTG9nZ2VkSW4iLCJsb2dvdXRMaW5rIiwiY3J5c3RhbGxpemVDdXN0b21lciIsIk9iamVjdCIsImFzc2lnbiIsInRva2VuIiwiand0IiwiZGVjb2RlZCIsInZlcmlmeSIsImUiLCJyZWRpcmVjdFVSTEFmdGVyTG9naW4iLCJlbWFpbFBhcnRzIiwic2lnbiIsImV4cGlyZXNJbiIsImVtYWlsU2VydmljZSIsInZhbGlkYXRlTWFnaWNMaW5rVG9rZW4iLCJzaWduZWRMb2dpblRva2VuIiwic2lnbmVkTG9naW5SZWZyZXNoVG9rZW4iLCJnZXRDcnlzdGFsbGl6ZVZvdWNoZXJzIiwidm91Y2hlcnNGcm9tQ3J5c3RhbGxpemUiLCJjYXRhbG9ndWUiLCJjaGlsZHJlbiIsInZvdWNoZXJGcm9tQ3J5c3RhbGxpemUiLCJkaXNjb3VudENvbXBvbmVudCIsImNvbnRlbnQiLCJzZWxlY3RlZENvbXBvbmVudCIsIm51bWJlciIsInRleHQiLCJvbmx5Rm9yQXV0aG9yaXNlZFVzZXIiLCJ2b3VjaGVyUmVnaXN0ZXIiLCJpc0Fub255bW91c1VzZXIiLCJhbGxDcnlzdGFsbGl6ZVZvdWNoZXJzIiwiYWxsVm91Y2hlcnMiXSwic291cmNlUm9vdCI6IiJ9