// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import educoin_artifacts from '../../abi/EduCoin.json'
import workshop_artifacts from '../../abi/WorkshopTokenDistribution.json'

// EduCoin is our usable abstraction, which we'll use through the code below.
var EduCoin = contract(educoin_artifacts);
var Workshop = contract(workshop_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

let projects = {}

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the EduCoin and Workshop abstraction for Use.
    EduCoin.setProvider(web3.currentProvider);
    Workshop.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      self.refreshWorkshop();
    });
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  refreshWorkshop: function() {
    var self = this;

    var activity;
    var workshop_id;
    Workshop.deployed().then(function(instance) {
      activity = instance;
      return activity.activeWorkshopId.call();
    }).then(function(wId) {
      workshop_id = wId.toString();
      return activity.nameOfworkshop.call(workshop_id);
    }).then(function(value) {
      var workshop_element = document.getElementById("workshop");
      workshop_element.innerHTML = value.toString();
    }).then(function() {
      return activity.tokensForProject.call();
    }).then(function(value) {
      var token_element = document.getElementById("tokens-for-project");
      token_element.innerHTML = value.valueOf()/(10**18);
    }).then(function() {
      return activity.tokensForVoting.call();
    }).then(function(value) {
      var token_element = document.getElementById("tokens-for-voting");
      token_element.innerHTML = value.valueOf()/(10**18);
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting workshop; see log.");
    });
  
    self.refreshProjects();
    self.refreshParticipants();

    Workshop.deployed().then(function(instance) {
      var address = instance.address.toString();
      var address_element = document.getElementById("contract-address");
      address_element.innerHTML = address;
      EduCoin.deployed().then(function(coin_instance) {
        coin_instance.balanceOf.call(address).then(function(b) {
          var balance_element = document.getElementById("edc-balance");
          balance_element.innerHTML = b.valueOf()/(10**18);
        });
      });
      web3.eth.getBalance(address, function(e, b) {
        var balance_element = document.getElementById("poa-balance");
        balance_element.innerHTML = b.valueOf()/(10**18);
      });
    });
  },

  refreshProjects: function() {
    var self = this;

    var activity;
    var workshop_id;
    Workshop.deployed().then(function(instance) {
      activity = instance;
      return activity.activeWorkshopId.call();
    }).then(function(wId) {
      workshop_id = wId.toString();
      return activity.numOfNextProject.call(workshop_id);
    }).then(function(value) {
      for(let i=0; i < value.valueOf(); i++) {
        var owner;
        var prjname;
        var row_element = document.getElementById("project-row-" + i);
        if (row_element !== "null")
          $("#project-row-" + i).remove();
        Workshop.deployed().then(function(instance) {
          activity.getProjectOfWorkshopByIndex.call(workshop_id, i).then(function(v) {
            owner = v.toString();
            $("#projects-rows").append("<tr id='project-row-" + i + "'><td id='name-project-" + i + "'></td><td>" + owner + "</td><td id='balance-project-" + i + "'></td></tr>");
            EduCoin.deployed().then(function(coin_instance) {
              coin_instance.balanceOf.call(v.toString()).then(function(b) {
                $("#balance-project-" + i).html(b.valueOf()/(10**18));
              });
            });
            return activity.projectOf.call(owner);
          }).then(function(name) {
            prjname = name.toString();
            $("#name-project-" + i).html(prjname);
          });
        });
      }
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting workshop; see log.");
    });
  },

  refreshParticipants: function() {
    var self = this;

    var activity;
    var workshop_id;
    Workshop.deployed().then(function(instance) {
      activity = instance;
      return activity.activeWorkshopId.call();
    }).then(function(wId) {
      workshop_id = wId.toString();
      return activity.numOfNextParticipant.call(workshop_id);
    }).then(function(value) {
      for(let i=0; i < value.valueOf(); i++) {
        var acnt;
        var partname;
        var row_element = document.getElementById("participant-row-" + i);
        if (row_element !== "null")
          $("#participant-row-" + i).remove();
        Workshop.deployed().then(function(instance) {
          activity.getParticipantOfWorkshopByIndex.call(workshop_id, i).then(function(v) {
            acnt = v.toString();
            $("#participants-rows").append("<tr id='participant-row-" + i + "'><td id='name-participant-" + i + "'></td><td>" + acnt + "</td><td id='balance-participant-" + i + "'></td></tr>");
            EduCoin.deployed().then(function(coin_instance) {
              coin_instance.balanceOf.call(v.toString()).then(function(b) {
                $("#balance-participant-" + i).html(b.valueOf()/(10**18));
              });
            });
            return activity.nameOf.call(acnt);
          }).then(function(name) {
            partname = name.toString();
            $("#name-participant-" + i).html(partname);
          });
        });
      }
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting workshop; see log.");
    });
  },

  addParticipant: function() {
    var self = this;

    var name = document.getElementById("participant-name").value;
    var address = document.getElementById("participant-account").value;

    this.setStatus("Initiating transaction... (please wait)");

    var workshop;
    Workshop.deployed().then(function(instance) {
      workshop = instance;
      return workshop.registerParticipant(address, name, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshParticipants();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  addProject: function() {
    var self = this;

    var name = document.getElementById("project-name").value;
    var address = document.getElementById("project-owner").value;

    this.setStatus("Initiating transaction... (please wait)");

    var workshop;
    Workshop.deployed().then(function(instance) {
      workshop = instance;
      return workshop.registerProject(address, name, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshProjects();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  createWorkshop: function() {
    var self = this;

    var name = document.getElementById("workshop-name").value;
    var address = document.getElementById("workshop-admin").value;

    this.setStatus("Initiating transaction... (please wait)");

    var workshop;
    Workshop.deployed().then(function(instance) {
      workshop = instance;
      var addr;
      if (address == "") {
        addr = account;
      } else {
        addr = address;
      }
      console.log(addr);
      return workshop.createWorkshop(name, addr, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      //self.refreshWorkshop();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  closeWorkshop: function() {
    var self = this;

    this.setStatus("Initiating transaction... (please wait)");

    var workshop;
    Workshop.deployed().then(function(instance) {
      workshop = instance;
      return workshop.closeWorkshop({from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshWorkshop();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  investTokens: function() {
    var self = this;

    var tvalue = parseInt(document.getElementById("token-amount").value);
    
    this.setStatus("Initiating transaction... (please wait)");

    var workshop;
    Workshop.deployed().then(function(instance) {
      workshop = instance;
      return workshop.tokensForProject.call();
    }).then(function(value) {
      var to_transfer = value.valueOf();
      if (tvalue === tvalue) { //if not "NaN"
        to_transfer = tvalue * (10**18);
      }
      return workshop.investToProjects(to_transfer, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshWorkshop();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  shareTokens: function() {
    var self = this;

    var tvalue = parseInt(document.getElementById("token-amount").value);

    this.setStatus("Initiating transaction... (please wait)");

    var workshop;
    Workshop.deployed().then(function(instance) {
      workshop = instance;
      return workshop.tokensForVoting.call();
    }).then(function(value) {
      var to_transfer = value.valueOf()
      if (tvalue === tvalue) {
        to_transfer = tvalue * (10**18); 
      }
      return workshop.shareForVoting(to_transfer, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshWorkshop();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  transferOwnership: function() {
    var self = this;

    var address = document.getElementById("contract-owner-address").value;

    this.setStatus("Initiating transaction... (please wait)");

    var workshop;
    Workshop.deployed().then(function(instance) {
      workshop = instance;
      return workshop.transferOwnership(address, {from: account});
    }).then(function() {
      self.setStatus("Transaction complete!");
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  hideAndShow: function() {
    var x = document.getElementById("admin-interface");
    var b = document.getElementById("hide-and-show");
    if (x.style.display === "none") {
      x.style.display = "block";
      b.innerText = "Hide controls";
    } else {
      x.style.display = "none";
      b.innerText = "Show controls";
    }
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:9545"));
  }

  App.start();
});
