# The Magic Link

This is the API for [The Magic Frog](https://github.com/mktcode/the-magic-frog) and [The Magic Story Machine](https://github.com/mktcode/the-magic-story-machine)... at least, maybe, someday it will be something like that.

# Nothing to see yet!

## Delegators

For now it only contains a wrapper endpoint for the [delegators API](https://helloacm.com/tools/steemit/delegators/), to hide the API key from network traffic.

https://api.the-magic-frog.com/delegators

It returns a list of all delegators for all the different frog accounts:

```
{
  "the-magic-frog": [
    {
      "sp": 501.41701130916545,
      "vests": 1019239.71,
      "time": "2018-04-12 10:36:48",
      "delegator": "mkt" // forever alone... :'(
    }
  ],
  "der-zauberfrosch": [],
  "grenouille": []
}
```

To make this run an API key is needed. It must be set as an env var:

```
export DELEGATORS_API_KEY=IdOnThaV4mFkEY
```

## More Endpoints

I am considering to set up an own database to store everything we need, in addition to storing it in the blockchain.
This API can then be the communication layer between the bots and the websites... something like that.