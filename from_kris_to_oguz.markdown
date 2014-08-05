
1. database.js

- updatePlan()

a)
check maximums, and suspends subplans eventually, even if new maximum is not overused
e.g. some user has 3 domains, and we chaged parents plan from maxDomains = 10 into 5.
still 5 > 3 so why to suspend subplan?

b)
also, i removed comparing max_org with max_new, since :
// this is pointless
// plan and data are already the same.
// data is plan object with values and methods fetched by database.getPlan("modified_plan")

schema to update a plan is:

 var plan = database.getPlan(plan_name);
 plan.maxDomainsCount = 5
 database.updatePlan(plan_name, plan);  // we pass the same object instance

c) when updating the plan, i added UnSuspend() call for this plan

 should we do also for subPlans?