

--- VERSION ---

using System.Collections.Generic;
using UnityEngine;

public class CheckGroundProjectile : MonoBehaviour
{
    [Header("Targets to Disable")]
    [Tooltip("List of game objects that will be disabled if the projectile fails to hit the ground.")]
    [SerializeField] private List<GameObject> targetObjects = new List<GameObject>();

    [Header("Collision & Detection")]
    [Tooltip("The layer(s) representing the ground.")]
    [SerializeField] private LayerMask groundLayer;
    [Tooltip("Whether to destroy the projectile immediately when it hits the ground.")]
    [SerializeField] private bool destroyOnGroundImpact = true;
    [Tooltip("Whether to destroy the projectile immediately when it hits anything other than the ground.")]
    [SerializeField] private bool destroyOnOtherImpact = true;

    [Header("Movement (Fallback)")]
    [Tooltip("Lifespan of the projectile before it is automatically destroyed.")]
    [SerializeField] private float lifetime = 5f;
    [Tooltip("Speed of the projectile if moving programmatically (without Rigidbody).")]
    [SerializeField] private float speed = 15f;

    private Rigidbody rb;
    private bool hitGround = false;

    private void Start()
    {
        rb = GetComponent<Rigidbody>();
        
        // Auto-destroy the projectile after its lifetime
        Destroy(gameObject, lifetime);
    }

    private void Update()
    {
        // Programmatic movement fallback if no Rigidbody is handling movement
        if (rb == null)
        {
            transform.Translate(Vector3.forward * speed * Time.deltaTime);
        }
    }

    private void OnCollisionEnter(Collision collision)
    {
        HandleImpact(collision.gameObject);
    }

    private void OnTriggerEnter(Collider other)
    {
        HandleImpact(other.gameObject);
    }

    private void HandleImpact(GameObject hitObject)
    {
        // Check if the hit object's layer is in the ground layer mask
        if (((1 << hitObject.layer) & groundLayer) != 0)
        {
            hitGround = true;
            
            if (destroyOnGroundImpact)
            {
                Destroy(gameObject);
            }
        }
        else
        {
            if (destroyOnOtherImpact)
            {
                Destroy(gameObject);
            }
        }
    }

    private void OnDestroy()
    {
        // If the projectile is destroyed without ever hitting the ground
        if (!hitGround)
        {
            foreach (GameObject target in targetObjects)
            {
                if (target != null)
                {
                    target.SetActive(false);
                    Debug.Log($"[CheckGroundProjectile] Disabled {target.name} because projectile did not hit the ground.");
                }
            }
        }
    }
}


--- VERSION ---

using System.Collections.Generic;
using UnityEngine;

public class CheckGroundProjectile : MonoBehaviour
{
    [Header("Targets to Disable")]
    [Tooltip("List of game objects that will be disabled if the projectile fails to hit the ground.")]
    [SerializeField] private List<GameObject> targetObjects = new List<GameObject>();

    [Header("Collision & Detection")]
    [Tooltip("The layer(s) representing the ground.")]
    [SerializeField] private LayerMask groundLayer;
    [Tooltip("Whether to destroy the projectile immediately when it hits the ground.")]
    [SerializeField] private bool destroyOnGroundImpact = true;
    [Tooltip("Whether to destroy the projectile immediately when it hits anything other than the ground.")]
    [SerializeField] private bool destroyOnOtherImpact = true;

    [Header("Movement (Fallback)")]
    [Tooltip("Lifespan of the projectile before it is automatically destroyed.")]
    [SerializeField] private float lifetime = 5f;
    [Tooltip("Speed of the projectile if moving programmatically (without Rigidbody).")]
    [SerializeField] private float speed = 15f;

    private Rigidbody rb;
    private bool hitGround = false;

    private void Start()
    {
        rb = GetComponent<Rigidbody>();
        
        // Auto-destroy the projectile after its lifetime
        Destroy(gameObject, lifetime);
    }

    private void Update()
    {
        // Programmatic movement fallback if no Rigidbody is handling movement
        if (rb == null)
        {
            transform.Translate(Vector3.forward * speed * Time.deltaTime);
        }
    }

    private void OnCollisionEnter(Collision collision)
    {
        HandleImpact(collision.gameObject);
    }

    private void OnTriggerEnter(Collider other)
    {
        HandleImpact(other.gameObject);
    }

    private void HandleImpact(GameObject hitObject)
    {
        // Check if the hit object's layer is in the ground layer mask
        if (((1 << hitObject.layer) & groundLayer) != 0)
        {
            hitGround = true;
            
            if (destroyOnGroundImpact)
            {
                Destroy(gameObject);
            }
        }
        else
        {
            if (destroyOnOtherImpact)
            {
                Destroy(gameObject);
            }
        }
    }

    private void OnDestroy()
    {
        // If the projectile is destroyed without ever hitting the ground
        if (!hitGround)
        {
            foreach (GameObject target in targetObjects)
            {
                if (target != null)
                {
                    target.SetActive(false);
                    Debug.Log($"[CheckGroundProjectile] Disabled {target.name} because projectile did not hit the ground.");
                }
            }
        }
    }
}


--- VERSION ---

using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class CheckGroundProjectile : MonoBehaviour
{
    [Header("Targets to Disable")]
    [Tooltip("List of game objects that will be disabled if the projectile fails to hit the ground.")]
    [SerializeField] private List<GameObject> targetObjects = new List<GameObject>();

    [Header("Collision & Detection")]
    [Tooltip("The layer(s) representing the ground.")]
    [SerializeField] private LayerMask groundLayer;
    [Tooltip("Whether to disable the projectile immediately when it hits the ground.")]
    [SerializeField] private bool disableOnGroundImpact = true;
    [Tooltip("Whether to disable the projectile immediately when it hits anything other than the ground.")]
    [SerializeField] private bool disableOnOtherImpact = true;

    [Header("Movement (Fallback)")]
    [Tooltip("Lifespan of the projectile before it is automatically disabled.")]
    [SerializeField] private float lifetime = 5f;
    [Tooltip("Speed of the projectile if moving programmatically (without Rigidbody).")]
    [SerializeField] private float speed = 15f;

    private Rigidbody rb;
    private bool hitGround = false;
    private Coroutine lifetimeCoroutine;

    private void Awake()
    {
        rb = GetComponent<Rigidbody>();
    }

    private void OnEnable()
    {
        hitGround = false;
        
        if (lifetimeCoroutine != null)
        {
            StopCoroutine(lifetimeCoroutine);
        }
        lifetimeCoroutine = StartCoroutine(DisableAfterLifetime());
    }

    private void OnDisable()
    {
        if (lifetimeCoroutine != null)
        {
            StopCoroutine(lifetimeCoroutine);
            lifetimeCoroutine = null;
        }

        // If the projectile is disabled without ever hitting the ground
        if (!hitGround)
        {
            foreach (GameObject target in targetObjects)
            {
                if (target != null)
                {
                    target.SetActive(false);
                    Debug.Log($"[CheckGroundProjectile] Disabled {target.name} because projectile did not hit the ground.");
                }
            }
        }
    }

    private IEnumerator DisableAfterLifetime()
    {
        yield return new WaitForSeconds(lifetime);
        gameObject.SetActive(false);
    }

    private void Update()
    {
        // Programmatic movement fallback if no Rigidbody is handling movement
        if (rb == null)
        {
            transform.Translate(Vector3.forward * speed * Time.deltaTime);
        }
    }

    private void OnCollisionEnter(Collision collision)
    {
        HandleImpact(collision.gameObject);
    }

    private void OnTriggerEnter(Collider other)
    {
        HandleImpact(other.gameObject);
    }

    private void HandleImpact(GameObject hitObject)
    {
        // Check if the hit object's layer is in the ground layer mask
        if (((1 << hitObject.layer) & groundLayer) != 0)
        {
            hitGround = true;
            
            if (disableOnGroundImpact)
            {
                gameObject.SetActive(false);
            }
        }
        else
        {
            if (disableOnOtherImpact)
            {
                gameObject.SetActive(false);
            }
        }
    }
}
